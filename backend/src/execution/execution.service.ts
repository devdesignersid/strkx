import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DriverGenerator } from './driver-generator';
import * as vm from 'vm';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  private activeExecutions = 0;
  private readonly MAX_CONCURRENT_EXECUTIONS = 10;

  constructor(
    private prisma: PrismaService,
    private driverGenerator: DriverGenerator,
  ) { }

  async execute(executeCodeDto: ExecuteCodeDto, user?: any) {
    if (this.activeExecutions >= this.MAX_CONCURRENT_EXECUTIONS) {
      throw new Error('Server is busy, please try again later.');
    }

    this.activeExecutions++;
    try {
      return await this.executeSafe(executeCodeDto, user);
    } finally {
      this.activeExecutions--;
    }
  }

  private async executeSafe(executeCodeDto: ExecuteCodeDto, user?: any) {
    const { code, problemSlug } = executeCodeDto;

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

    const results: any[] = [];
    let allPassed = true;
    let totalExecutionTime = 0;
    let totalMemoryUsed = 0;

    for (const testCase of problem.testCases) {
      const logs: string[] = [];
      const sandbox = {
        console: {
          log: (...args: any[]) => {
            if (logs.length < 100) {
              logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            }
          },
          error: (...args: any[]) => {
            if (logs.length < 100) {
              logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            }
          },
          warn: (...args: any[]) => {
            if (logs.length < 100) {
              logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            }
          },
          info: (...args: any[]) => {
            if (logs.length < 100) {
              logs.push('[INFO] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            }
          },
        },
        result: undefined,
      };

      let functionName = 'solution';
      // Try to extract from user code first
      let match = code.match(/var\s+(\w+)\s*=/);
      if (!match) match = code.match(/function\s+(\w+)\s*\(/);
      if (!match) match = code.match(/const\s+(\w+)\s*=/);
      if (!match) match = code.match(/let\s+(\w+)\s*=/);

      // Fallback to problem starter code
      if (!match && problem.starterCode) {
        match = problem.starterCode.match(/var\s+(\w+)\s*=/);
        if (!match) match = problem.starterCode.match(/function\s+(\w+)\s*\(/);
      }

      if (match && match[1]) {
        functionName = match[1];
      }

      let inputData;
      let args: any[] = [];

      let parsedDirectlyAsArray = false;

      try {
        if (typeof testCase.input === 'string') {
          // Robust JSON parsing
          let jsonString = testCase.input.trim();

          // Attempt to fix common JS object notation issues
          if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
            // Heuristic: if it looks like "key: value", wrap in braces?
            // Or maybe it's just values "1, 2".
            // Let's try to wrap in [] if it fails initial parse
          }

          // Replace key: with "key":
          jsonString = jsonString.replace(/(\w+):/g, '"$1":');
          // Remove variable assignments
          jsonString = jsonString.replace(/[a-zA-Z0-9_]+\s*=\s*/g, '');

          try {
            inputData = JSON.parse(jsonString);
          } catch (e) {
            // Try wrapping in array
            try {
              inputData = JSON.parse(`[${jsonString}]`);
            } catch (e2) {
              throw new Error(`Failed to parse input: ${testCase.input}`);
            }
          }

          if (Array.isArray(inputData)) {
            // Check if the original string started with '[' to determine if it was explicitly an array
            // or if we wrapped it (or if it was just a list of values that JSON.parse accepted as array? No, JSON.parse only accepts single value)
            // Actually, if we successfully parsed `jsonString` and it is an array, it means the input WAS an array (e.g. "[1, 2]" or "[\"\"]")
            // UNLESS we fell back to the `try wrapping in array` block.

            // Let's refine this.
            // If the first try succeeded:
            //   If jsonString started with '[', then it is explicitly an array.
            //   If it didn't start with '[', it's unlikely to be an array unless it was just "null" or something, but we are checking Array.isArray.

            // Wait, if input is `1, 2`, the first JSON.parse fails. The second one `[1, 2]` succeeds. `inputData` is `[1, 2]`. `parsedDirectlyAsArray` should be FALSE (it's a list of args).
            // If input is `[1, 2]`, the first JSON.parse succeeds. `inputData` is `[1, 2]`. `parsedDirectlyAsArray` should be TRUE (it's a single argument that is an array).

            // We need to know WHICH try block succeeded.
          }
        } else {
          inputData = testCase.input;
          args = [inputData];
        }

        // Re-implementing the parsing logic to capture the flag
        if (typeof testCase.input === 'string') {
          let jsonString = testCase.input.trim();
          jsonString = jsonString.replace(/(\w+):/g, '"$1":');
          jsonString = jsonString.replace(/[a-zA-Z0-9_]+\s*=\s*/g, '');

          let firstParseSuccess = false;
          try {
            inputData = JSON.parse(jsonString);
            firstParseSuccess = true;
          } catch (e) {
            // Fallback
          }

          if (firstParseSuccess) {
            if (Array.isArray(inputData)) {
              args = inputData;
              parsedDirectlyAsArray = true; // It was "[...]"
            } else {
              args = [inputData];
              parsedDirectlyAsArray = false; // It was "1" or "true" or "{...}"
            }
          } else {
            // Try wrapping
            try {
              inputData = JSON.parse(`[${jsonString}]`);
              args = inputData;
              parsedDirectlyAsArray = false; // It was "1, 2" -> became [1, 2] -> args list
            } catch (e2) {
              throw new Error(`Failed to parse input: ${testCase.input}`);
            }
          }
        } else {
          // Non-string input (already parsed?)
          inputData = testCase.input;
          args = [inputData];
          parsedDirectlyAsArray = false; // Treat as single arg
        }

      } catch (err: any) {
        allPassed = false;
        results.push({
          testCaseId: testCase.id,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          error: `Input parsing error: ${err.message}`,
          logs: [],
          executionTimeMs: 0,
          memoryUsedBytes: 0,
        });
        continue;
      }

      try {
        const startTime = performance.now();

        let scriptToRun = code;
        let isDesignProblem = false;

        if (problem.type === 'DESIGN' && problem.className) {
          isDesignProblem = true;
          const driverScript = this.driverGenerator.generate(problem.className);
          scriptToRun = code + '\n' + driverScript;

          // For Design problems, inputs are { commands: [], values: [] }
          // We need to make sure 'commands' and 'values' are available in the context
          if (args.length === 1 && typeof args[0] === 'object' && args[0].commands && args[0].values) {
            sandbox['commands'] = args[0].commands;
            sandbox['values'] = args[0].values;
          } else {
            // Handle case where input might be parsed differently or raw string
            // If it's a raw string that parses to the structure
            if (args.length === 1 && typeof args[0] === 'string') {
              try {
                const parsed = JSON.parse(args[0]);
                if (parsed.commands && parsed.values) {
                  sandbox['commands'] = parsed.commands;
                  sandbox['values'] = parsed.values;
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }

        const context = vm.createContext({
          ...sandbox,
          args,
          parsedDirectlyAsArray,
        });

        vm.runInNewContext(
          `
          ${scriptToRun}
          try {
             if (!${isDesignProblem}) {
                if (typeof ${functionName} === 'function') {
                   if (parsedDirectlyAsArray) {
                       result = ${functionName}(args);
                   } else {
                       result = ${functionName}(...args);
                   }
                } else {
                   throw new Error('Function ${functionName} not found');
                }
             }
             // For Design problems, the driver script sets 'result' directly
          } catch (e) {
            throw e;
          }
          `,
          context,
          {
            timeout: 1000,
            displayErrors: true,
          }
        );

        const endTime = performance.now();
        const executionTime = endTime - startTime;
        totalExecutionTime += executionTime;

        const actual = context.result;

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

        const isCorrect = JSON.stringify(actual) === JSON.stringify(expected);

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
          logs: logs,
          executionTimeMs: 0,
          memoryUsedBytes: 0,
        });

        if (error.message && error.message.includes('Script execution timed out')) {
          break;
        }
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
      } catch (error) {
        this.logger.error('Failed to save submission', error);
      }
    }

    return {
      passed: allPassed,
      results,
    };
  }
}
