"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const vm = __importStar(require("vm"));
let ExecutionService = class ExecutionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(executeCodeDto) {
        const { code, problemSlug } = executeCodeDto;
        const problem = await this.prisma.problem.findUnique({
            where: { slug: problemSlug },
            include: { testCases: true },
        });
        if (!problem) {
            throw new common_1.NotFoundException('Problem not found');
        }
        const results = [];
        let allPassed = true;
        let totalExecutionTime = 0;
        let totalMemoryUsed = 0;
        for (const testCase of problem.testCases) {
            const logs = [];
            const sandbox = {
                console: {
                    log: (...args) => {
                        logs.push(args
                            .map((a) => typeof a === 'object' ? JSON.stringify(a) : String(a))
                            .join(' '));
                    },
                },
                result: undefined,
            };
            let functionName = 'solution';
            let match = code.match(/var\s+(\w+)\s*=/);
            if (!match)
                match = code.match(/function\s+(\w+)\s*\(/);
            if (!match)
                match = code.match(/const\s+(\w+)\s*=/);
            if (!match)
                match = code.match(/let\s+(\w+)\s*=/);
            if (!match && problem.starterCode) {
                match = problem.starterCode.match(/var\s+(\w+)\s*=/);
                if (!match)
                    match = problem.starterCode.match(/function\s+(\w+)\s*\(/);
            }
            if (match && match[1]) {
                functionName = match[1];
            }
            console.log('Extracted function name:', functionName);
            console.log('User code preview:', code.substring(0, 200));
            let inputData;
            if (typeof testCase.input === 'string') {
                const jsonString = testCase.input.replace(/(\w+):/g, '"$1":');
                try {
                    inputData = JSON.parse(jsonString);
                }
                catch (err) {
                    console.error('Failed to parse testCase.input:', testCase.input);
                    console.error('Converted to:', jsonString);
                    throw err;
                }
            }
            else {
                inputData = testCase.input;
            }
            const args = (typeof inputData === 'object' && inputData !== null)
                ? Object.values(inputData)
                : [inputData];
            try {
                const startTime = performance.now();
                const context = vm.createContext({
                    ...sandbox,
                    args,
                });
                vm.runInNewContext(`
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
          `, context, {
                    timeout: 1000,
                    displayErrors: true,
                });
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                totalExecutionTime += executionTime;
                const actual = context.result;
                let expected;
                if (typeof testCase.expectedOutput === 'string') {
                    const jsonString = testCase.expectedOutput.replace(/(\w+):/g, '"$1":');
                    try {
                        expected = JSON.parse(jsonString);
                    }
                    catch {
                        expected = testCase.expectedOutput;
                    }
                }
                else {
                    expected = testCase.expectedOutput;
                }
                const isCorrect = JSON.stringify(actual) === JSON.stringify(expected);
                if (!isCorrect)
                    allPassed = false;
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
            }
            catch (error) {
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
        if (executeCodeDto.mode === 'submit') {
            const user = await this.prisma.user.findUnique({
                where: { email: 'demo@example.com' },
            });
            if (user) {
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
};
exports.ExecutionService = ExecutionService;
exports.ExecutionService = ExecutionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExecutionService);
//# sourceMappingURL=execution.service.js.map