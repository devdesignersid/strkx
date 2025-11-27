import { Injectable, NotFoundException } from '@nestjs/common';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as vm from 'vm';

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async execute(executeCodeDto: ExecuteCodeDto) {
    const { code, problemSlug } = executeCodeDto;

    const problem = await this.prisma.problem.findUnique({
      where: { slug: problemSlug },
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
            logs.push(
              args
                .map((a) =>
                  typeof a === 'object' ? JSON.stringify(a) : String(a),
                )
                .join(' '),
            );
          },
        },
        result: undefined,
      };

      // Wrap code to call the function with input
      // Assuming JS for now.
      // We expect the user to define a function matching the starter code.
      // For Two Sum: var twoSum = function(nums, target) { ... }
      // We need to append the call: result = twoSum(...args)

      // We need to know the function name. For now, let's assume it's the last defined function or we can regex it from starter code.
      // Or simpler: The user code defines 'twoSum'. We append `twoSum(nums, target)`

      // Hacky way to find function name from problem starter code or just hardcode for MVP if we assume specific format.
      // Better: The problem should store the "functionName" metadata.
      // For now, let's try to infer or just wrap the user code.

      // Let's assume the user code defines the function.
      // We will append: `result = twoSum(${args})`
      // But we need the function name.

      // Let's extract function name from user code or problem starter code using regex
      // Try multiple patterns:
      // 1. var functionName = function(...) {...}
      // 2. function functionName(...) {...}
      // 3. const functionName = (...) => {...}

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

      console.log('Extracted function name:', functionName);
      console.log('User code preview:', code.substring(0, 200));

      // Parse the input  (it might be a string or already an object)
      // The input might be in JavaScript object notation (e.g., {a: 1}) instead of JSON (e.g., {"a": 1})
      // We need to convert it to valid JSON first

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let inputData;
      if (typeof testCase.input === 'string') {
        // Convert JavaScript object notation to JSON by adding quotes to unquoted keys
        // This regex finds keys like "key:" and converts them to "key":
        const jsonString = testCase.input.replace(/(\w+):/g, '"$1":');
        try {
          inputData = JSON.parse(jsonString);
        } catch (err) {
          console.error('Failed to parse testCase.input:', testCase.input);
          console.error('Converted to:', jsonString);
          throw err;
        }
      } else {
        inputData = testCase.input;
      }
      const inputValues = Object.values(inputData);

      // Generate function call arguments
      const args = inputValues.map((_, i) => `inputValues[${i}]`).join(', ');

      const runCode = `
        ${code}

        // Call the function with the parsed input values
        result = ${functionName}(${args});
      `;

      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage().heapUsed;

      try {
        // Add inputValues to sandbox
        const contextSandbox = {
          ...sandbox,
          inputValues,
        };
        vm.createContext(contextSandbox);
        vm.runInContext(runCode, contextSandbox, { timeout: 1000 });

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage().heapUsed;

        // Calculate metrics (convert bigint to number for milliseconds)
        const executionTimeMs = Number(endTime - startTime) / 1_000_000; // nanoseconds to milliseconds
        const memoryUsedBytes = Math.max(0, endMemory - startMemory);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let expected: any;
        if (typeof testCase.expectedOutput === 'string') {
          const jsonString = testCase.expectedOutput.replace(/(\w+):/g, '"$1":');
          expected = JSON.parse(jsonString);
        } else {
          expected = testCase.expectedOutput;
        }
        const actual = contextSandbox.result;

        // Deep compare (simple JSON stringify for now)
        const passed = JSON.stringify(actual) === JSON.stringify(expected);

        if (!passed) allPassed = false;

        results.push({
          testCaseId: testCase.id,
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          actualOutput: actual,
          logs: [],
          executionTimeMs,
          memoryUsedBytes,
        });

        // Accumulate metrics (we'll average them)
        totalExecutionTime += executionTimeMs;
        totalMemoryUsed += memoryUsedBytes;
      } catch (error) {
        allPassed = false;
        results.push({
          testCaseId: testCase.id,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          error: (error as Error).message,
          logs,
        });
      }
    }

    // Only save submission if mode is 'submit'
    if (executeCodeDto.mode === 'submit') {
      const user = await this.prisma.user.findUnique({
        where: { email: 'demo@example.com' },
      });

      if (user) {
        // Calculate average metrics across all test cases
        const numTestCases = problem.testCases.length;
        const avgExecutionTime = numTestCases > 0 ? totalExecutionTime / numTestCases : 0;
        const avgMemoryUsed = numTestCases > 0 ? totalMemoryUsed / numTestCases : 0;

        await this.prisma.submission.create({
          data: {
            code,
            language: 'javascript',
            status: allPassed ? 'ACCEPTED' : 'REJECTED',
            output: JSON.stringify(results),
            problemId: problem.id,
            userId: user.id,
            executionTime: avgExecutionTime,
            memoryUsed: avgMemoryUsed,
          },
        });
      }
    }

    return {
      passed: allPassed,
      results,
    };
  }
}
