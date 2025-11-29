import { Injectable, NotFoundException } from '@nestjs/common';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as vm from 'vm';

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async execute(executeCodeDto: ExecuteCodeDto, user?: any) {
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
      let args: any[] = [];
      if (typeof testCase.input === 'string') {
        // Convert JavaScript object notation to JSON by adding quotes to unquoted keys
        // This regex finds keys like "key:" and converts them to "key":
        // Convert JavaScript object notation to JSON by adding quotes to unquoted keys
        // This regex finds keys like "key:" and converts them to "key":
        let jsonString = testCase.input.replace(/(\w+):/g, '"$1":');

        // Sanitize: Remove variable assignment if present (e.g. "nums = [...]" -> "[...]")
        // We use a global replace to handle multiple assignments like "nums = [...], target = ..."
        jsonString = jsonString.replace(/[a-zA-Z0-9_]+\s*=\s*/g, '');

        try {
          inputData = JSON.parse(jsonString);

          // If successful, we assume it's a single argument
          if (Array.isArray(inputData)) {
             args = [inputData];
          } else if (typeof inputData === 'object' && inputData !== null) {
             // If it's an object, we might want to treat values as args, but it's ambiguous.
             // For now, treat as single object argument unless it matches specific structure?
             // Let's stick to treating it as single arg for safety, or Object.values if user intended named args.
             // Given the ambiguity, treating as single arg is safer for JSON inputs.
             args = [inputData];
          } else {
             args = [inputData];
          }
        } catch (err) {
          // If parsing failed, it might be multiple arguments separated by commas (e.g. "1, 2" or "[1,2], 3")
          // Try wrapping in brackets
          try {
            const wrappedJson = `[${jsonString}]`;
            inputData = JSON.parse(wrappedJson);
            // If this succeeds, inputData is an array of arguments
            args = inputData;
          } catch (wrappedErr) {
            console.error('Failed to parse testCase.input:', testCase.input);
            console.error('Converted to:', jsonString);
            throw err;
          }
        }
      } else {
        inputData = testCase.input;
        args = [inputData];
      }

      // Hardened Execution Sandbox
      try {
        const startTime = performance.now();

        // Create a secure context
        const context = vm.createContext({
          ...sandbox,
          args, // Pass prepared arguments to the sandbox
        });

        // Execute with strict limits
        // 1. Timeout: 1000ms (1s) to prevent infinite loops
        // 2. No access to process/require
        vm.runInNewContext(
          `
          ${code}
          // Append the function call
          try {
             if (typeof ${functionName} === 'function') {
               result = ${functionName}(...args);
             } else {
               throw new Error('Function ${functionName} not found');
             }
          } catch (e) {
            throw e;
          }
          `,
          context,
          {
            timeout: 1000, // 1s hard timeout
            displayErrors: true,
          }
        );

        const endTime = performance.now();
        const executionTime = endTime - startTime;
        totalExecutionTime += executionTime;

        // Check correctness
        const actual = context.result;

        // Compare result with expected output
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

    // Only save submission if mode is 'submit'
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
            executionTime: totalExecutionTime / problem.testCases.length,
            memoryUsed: totalMemoryUsed / problem.testCases.length,
          },
        });
      } catch (error) {
        console.error('Failed to save submission:', error);
        // Don't fail the execution if submission save fails
      }
    }

    return {
      passed: allPassed,
      results,
    };
  }
}
