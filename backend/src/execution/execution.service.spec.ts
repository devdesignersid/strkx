import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './execution.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ExecutionService', () => {
  let service: ExecutionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    problem: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    submission: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const problem = {
      id: '1',
      slug: 'two-sum',
      testCases: [
        { id: 't1', input: '[2,7,11,15]', expectedOutput: '[0,1]' },
      ],
    };

    const mockUser = { id: 'user1', email: 'test@example.com' };

    it('should execute valid code and pass', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `
        function twoSum(nums, target) {
          return [0, 1];
        }
      `;

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it('should handle incorrect solution', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `
        function twoSum(nums, target) {
          return [0, 0];
        }
      `;

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
    });

    it('should handle syntax error', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `function twoSum(nums, target) { return [0, 1]`; // Missing brace

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.passed).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });

    it('should handle infinite loop (timeout)', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `
        function twoSum(nums, target) {
          while(true) {}
          return [0, 1];
        }
      `;

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.passed).toBe(false);
      expect(result.results[0].error).toContain('Script execution timed out');
    });

    it('should handle multiple arguments input (e.g. [1,2], 3)', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `
        function twoSum(nums, target) {
          return [0, 1];
        }
      `;

      // Mock test case with multiple args string
      const multiArgProblem = {
        ...problem,
        testCases: [{ id: 't2', input: '[2,7,11,15], 9', expectedOutput: '[0,1]' }]
      };
      mockPrismaService.problem.findUnique.mockResolvedValue(multiArgProblem);

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.passed).toBe(true);
    });

    it('should save submission if mode is submit', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);
      // mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user1' }); // No longer needed as we pass user

      const code = `function twoSum() { return [0,1]; }`;

      await service.execute({
        code, problemSlug: 'two-sum', mode: 'submit',
        language: ''
      }, mockUser);

      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'ACCEPTED',
          problemId: '1',
          userId: 'user1',
        }),
      });
    });

    it('should throw NotFoundException if problem not found', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(service.execute({
        code: '', problemSlug: 'unknown', mode: 'run',
        language: ''
      }, mockUser))
        .rejects.toThrow(NotFoundException);
    });
    it('should capture console logs', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `
        function twoSum(nums, target) {
          console.log('Hello from sandbox');
          return [0, 1];
        }
      `;

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.results[0].logs).toBeDefined();
      expect(result.results[0].logs).toContain('Hello from sandbox');
    });

    it('should capture console.error logs', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      const code = `
        function twoSum(nums, target) {
          console.error('Error log');
          return [0, 1];
        }
      `;

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.results[0].logs).toBeDefined();
      expect(result.results[0].logs.some(l => l.includes('[ERROR] Error log'))).toBe(true);
    });

    it('should handle single array argument heuristic', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problem);

      // Input is [1, 2, 3] -> args = [1, 2, 3]
      // Function expects 1 arg -> solution([1, 2, 3])
      const code = `
        function solution(nums) {
          return nums.length;
        }
      `;

      const singleArgProblem = {
        ...problem,
        testCases: [{ id: 't3', input: '[1, 2, 3]', expectedOutput: '3' }]
      };
      mockPrismaService.problem.findUnique.mockResolvedValue(singleArgProblem);

      const result = await service.execute({
        code, problemSlug: 'two-sum', mode: 'run',
        language: ''
      }, mockUser);

      expect(result.passed).toBe(true);
      expect(result.results[0].actualOutput).toBe('3');
    });
  });
});
