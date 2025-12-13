import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DriverGenerator } from './driver-generator';
import { Worker } from 'worker_threads';
import * as path from 'path';

import { HydrationService } from './hydration.service';

import { DashboardService } from '../dashboard/dashboard.service';
import { TestCaseResult, WorkerResult, WorkerContext, DesignProblemInput, ExecutionUser } from './execution.types';
import { compare, getComparisonType, ComparisonType } from './judge/comparator';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  private activeExecutions = 0;
  private readonly MAX_CONCURRENT_EXECUTIONS = 10;
  private readonly QUEUE_TIMEOUT_MS = 30000; // 30s queue timeout

  constructor(
    private prisma: PrismaService,
    private driverGenerator: DriverGenerator,
    private hydrationService: HydrationService,
    private dashboardService: DashboardService,
  ) { }

  async execute(executeCodeDto: ExecuteCodeDto, user?: ExecutionUser) {
    // Simple in-memory concurrency control
    // In a real production environment with multiple instances, use Redis/Postgres
    if (this.activeExecutions >= this.MAX_CONCURRENT_EXECUTIONS) {
      // Simple retry logic or fail fast
      throw new Error('Server is busy, please try again later.');
    }

    this.activeExecutions++;
    try {
      return await this.executeSafe(executeCodeDto, user);
    } finally {
      this.activeExecutions--;
    }
  }

  private async executeSafe(executeCodeDto: ExecuteCodeDto, user?: ExecutionUser) {
    const { code, problemSlug } = executeCodeDto;

    if (!user) {
      throw new NotFoundException('User not authenticated');
    }

    const problem = await this.prisma.problem.findFirst({
      where: {
        slug: problemSlug,
        userId: user.id,
      },
      include: { testCases: true },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const results: TestCaseResult[] = [];
    let allPassed = true;
    let totalExecutionTime = 0;

    // Run sequentially to avoid log interleaving and race conditions
    for (const testCase of problem.testCases) {
      // Using any for args/inputData due to dynamic JSON parsing from test cases
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let args: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let inputData: any;
      let isDesignProblem = false;

      // --- Input Parsing ---
      try {
        if (problem.type === 'DESIGN') {
          isDesignProblem = true;
          inputData = JSON.parse(testCase.input);
          args = [inputData];
        } else {
          try {
            inputData = JSON.parse(testCase.input);
          } catch (e) {
            // Fallback: Try parsing as space/newline-separated JSON values
            // This handles cases like "2 [[1,0]]" or "2\n[[1,0]]"
            // We use a regex to replace whitespace between valid JSON tokens with commas
            // Regex explanation:
            // Lookbehind: End of a value (digit, ], }, ", true, false, null)
            // Match: One or more whitespace characters
            // Lookahead: Start of a value ([, {, ", digit, -, true, false, null)
            const regex = /(?<=[\]}"\d]|true|false|null)\s+(?=[\[{"\d-]|true|false|null)/g;
            const fixedInput = testCase.input.replace(regex, ',');

            try {
              inputData = JSON.parse(`[${fixedInput}]`);
            } catch (e2) {
              // If that fails, try the simple line split as a last resort
              // IMPORTANT: Don't use .filter(l => l) as it removes empty strings ""
              // which are valid JSON values. Only filter truly empty lines.
              const lines = testCase.input.split('\n').map(l => l.trim());
              const nonEmptyLines = lines.filter(l => l.length > 0);
              if (nonEmptyLines.length > 1) {
                try {
                  inputData = nonEmptyLines.map(line => JSON.parse(line));
                } catch (e3) {
                  throw new Error(`Input parsing error: ${e.message}`);
                }
              } else {
                throw new Error(`Input parsing error: ${e.message}`);
              }
            }
          }

          const parsedDirectlyAsArray = Array.isArray(inputData);
          args = parsedDirectlyAsArray ? inputData : [inputData];

          if (problem.inputTypes && problem.inputTypes.length === 1 && parsedDirectlyAsArray) {
            const type = problem.inputTypes[0];
            const isArrayType = type.endsWith('[]'); // string[], number[], string[][], etc.
            const isStructure = type === 'ListNode' || type === 'TreeNode' || type === 'GraphNode';

            // If the expected input type is an array type, wrap the entire parsed array as one argument
            // This fixes issues like [""] becoming "" instead of [""]
            if (isArrayType) {
              // The parsed array IS the argument, wrap it
              args = [inputData];
            } else if (args.length > 1) {
              // Multiple primitives parsed, wrap as single array argument
              args = [args];
            } else if (args.length === 1 && isStructure && !Array.isArray(args[0]) && args[0] !== null) {
              args = [args];
            } else if (type === 'GraphNode' && Array.isArray(args) && args.length > 0 && Array.isArray(args[0])) {
              // Special case for GraphNode: input is [[], []] (Adjacency List)
              // We parsed it as args = [[], []]
              // But we want args = [[[], []]] (One argument which is the Adjacency List)
              args = [args];
            }
          }
        }
      } catch (e) {
        allPassed = false;
        results.push({
          testCaseId: testCase.id,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          error: `Input parsing error: ${e.message}`,
          logs: [],
          executionTimeMs: 0,
          memoryUsedBytes: 0,
        });
        continue;
      }

      let scriptToRun = '';
      if (problem.type === 'DESIGN') {
        // Determine the class name - use explicit className from problem, or fallback to first command (constructor name)
        const className = problem.className || args[0].commands[0];

        scriptToRun = `
          ${code}

          const commands = ${JSON.stringify(args[0].commands)};
          const values = ${JSON.stringify(args[0].values)};
          const results = [];

          let obj = null;

          for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const cmdArgs = values[i];

            if (i === 0) {
              // Constructor - use explicit class name
              obj = new ${className}(...cmdArgs);
              results.push(null);
            } else {
              if (obj && typeof obj[cmd] === 'function') {
                const retVal = obj[cmd](...cmdArgs);
                results.push(retVal === undefined ? null : retVal);
              } else {
                results.push(null);
              }
            }
          }

          global.result = results;
        `;
      } else {
        // Algorithmic Problem with Hydration
        scriptToRun = this.hydrationService.generateWrapper(
          code,
          problem.inputTypes || [], // Default to empty if not set
          problem.returnType
        );
      }

      // Execute in Worker
      const startTime = performance.now();
      try {
        const workerResult = await this.runInWorker(scriptToRun, {
          args,
          commands: isDesignProblem && args.length === 1 ? args[0].commands : undefined,
          values: isDesignProblem && args.length === 1 ? args[0].values : undefined,
          timeoutMs: problem.timeoutMs,
          memoryLimitMb: problem.memoryLimitMb,
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;
        totalExecutionTime += executionTime;

        const actual = workerResult.result;
        const logs = workerResult.logs || [];

        let expected: any;
        if (typeof testCase.expectedOutput === 'string') {
          const jsonString = testCase.expectedOutput.replace(/(\w+):/g, '"$1":');
          try {
            expected = JSON.parse(jsonString);
          } catch {
            expected = testCase.expectedOutput;
          }
        } else {
          expected = testCase.expectedOutput;
        }

        // Use the problem's comparison type for result validation
        const comparisonType = getComparisonType(problem.comparisonType);
        const isCorrect = compare(actual, expected, comparisonType);
        if (!isCorrect) allPassed = false;

        results.push({
          testCaseId: testCase.id,
          passed: isCorrect,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: JSON.stringify(actual),
          logs: logs,
          executionTimeMs: executionTime,
          memoryUsedBytes: 0,
        });

      } catch (error: any) {
        allPassed = false;
        results.push({
          testCaseId: testCase.id,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          error: error.message,
          logs: error.logs || [],
          executionTimeMs: 0,
          memoryUsedBytes: 0,
        });
      }
    }

    if (executeCodeDto.mode === 'submit' && user) {
      try {
        await this.prisma.submission.create({
          data: {
            code,
            language: 'javascript',
            status: allPassed ? 'ACCEPTED' : 'REJECTED',
            output: JSON.stringify(results),
            problemId: problem.id,
            userId: user.id,
            executionTime: problem.testCases.length > 0 ? totalExecutionTime / problem.testCases.length : 0,
            memoryUsed: 0,
          },
        });

        // Invalidate dashboard cache so stats update immediately
        this.dashboardService.invalidateUserCache(user.id);

      } catch (error) {
        this.logger.error('Failed to save submission', error);
      }
    }

    return {
      passed: allPassed,
      results,
    };
  }

  private runInWorker(code: string, context: any): Promise<{ result: any, logs: string[] }> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'execution.worker.js'), {
        workerData: {
          code,
          context,
          timeout: (context.timeoutMs || 2000),
          memoryLimitMb: (context.memoryLimitMb || 128),
        },
      });

      worker.on('message', (message) => {
        if (message.success) {
          resolve(message);
        } else {
          reject(message);
        }
        worker.terminate();
      });

      worker.on('error', (error) => {
        reject({ message: error.message, logs: [] });
        worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject({ message: `Worker stopped with exit code ${code}`, logs: [] });
        }
      });
    });
  }
}
