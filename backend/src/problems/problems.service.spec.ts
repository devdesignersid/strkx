import { Test, TestingModule } from '@nestjs/testing';
import { ProblemsService } from './problems.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ExecutionService } from '../execution/execution.service';
import { NotFoundException } from '@nestjs/common';
import { CreateProblemDto, Difficulty } from './dto/create-problem.dto';

describe('ProblemsService', () => {
  let service: ProblemsService;
  let prisma: PrismaService;
  let dashboardService: DashboardService;
  let executionService: ExecutionService;

  const mockPrismaService = {
    problem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    testCase: {
      deleteMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    problemsOnLists: {
      deleteMany: jest.fn(),
    },
    interviewQuestion: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg(mockPrismaService);
    }),
  };

  const mockDashboardService = {
    invalidateUserCache: jest.fn(),
  };

  const mockExecutionService = {
    invalidateProblemCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: ExecutionService, useValue: mockExecutionService },
      ],
    }).compile();

    service = module.get<ProblemsService>(ProblemsService);
    prisma = module.get<PrismaService>(PrismaService);
    dashboardService = module.get<DashboardService>(DashboardService);
    executionService = module.get<ExecutionService>(ExecutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a problem with test cases', async () => {
      const dto: CreateProblemDto = {
        title: 'Test Problem',
        slug: 'test-problem',
        description: 'Desc',
        difficulty: Difficulty.Easy as any,
        tags: ['array'],
        testCases: [{ input: '1', expectedOutput: '1' }],
      };
      const user = { id: 'user1' };
      const expectedResult = { id: '1', ...dto };

      mockPrismaService.problem.create.mockResolvedValue(expectedResult);

      const result = await service.create(dto, user);

      expect(prisma.problem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: dto.title,
          userId: user.id,
          testCases: { create: dto.testCases },
        }),
        include: { testCases: true },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated and enriched problems', async () => {
      const user = { id: 'user1' };
      const problems = [
        { id: '1', title: 'P1', difficulty: 'Easy', createdAt: new Date(), submissions: [{ status: 'ACCEPTED' }] },
        { id: '2', title: 'P2', difficulty: 'Medium', createdAt: new Date(), submissions: [] },
      ];
      const total = 2;

      mockPrismaService.problem.findMany.mockResolvedValue(problems);
      mockPrismaService.problem.count.mockResolvedValue(total);

      const result = await service.findAll({ page: 1, limit: 10, skip: 0, take: 10 } as any, undefined, undefined, undefined, user);

      expect(prisma.problem.findMany).toHaveBeenCalled();
      expect(result.problems).toHaveLength(2);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBe(2);
      expect(result.problems[0].status).toBe('Solved');
      expect(result.problems[1].status).toBe('Todo');
    });

    it('should filter by difficulty', async () => {
      const user = { id: 'user1' };
      mockPrismaService.problem.findMany.mockResolvedValue([]);
      mockPrismaService.problem.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, skip: 0, take: 10 } as any, 'Easy', undefined, undefined, user);

      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: { in: ['Easy'] },
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return problem if owned by user', async () => {
      const user = { id: 'user1' };
      const problem = { id: '1', slug: 'slug', userId: 'user1' };
      mockPrismaService.problem.findFirst.mockResolvedValue(problem);

      const result = await service.findOne('slug', user.id);
      expect(result).toEqual(problem);
    });

    it('should throw NotFoundException if not owned by user', async () => {
      const user = { id: 'user1' };
      mockPrismaService.problem.findFirst.mockResolvedValue(null);

      await expect(service.findOne('slug', user.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update problem and replace test cases', async () => {
      const user = { id: 'user1' };
      const problem = { id: '1', userId: 'user1', slug: 'test-problem' };
      const dto = { title: 'New Title', testCases: [] };

      mockPrismaService.problem.findUnique.mockResolvedValue(problem);
      mockPrismaService.problem.update.mockResolvedValue({ ...problem, ...dto });

      await service.update('1', dto, user.id);

      expect(prisma.testCase.deleteMany).toHaveBeenCalledWith({ where: { problemId: '1' } });
      expect(prisma.problem.update).toHaveBeenCalled();
      expect(executionService.invalidateProblemCache).toHaveBeenCalledWith('test-problem', 'user1');
    });
  });

  describe('remove', () => {
    it('should delete submissions, test cases, and problem', async () => {
      const user = { id: 'user1' };
      const problem = { id: '1', userId: 'user1' };

      mockPrismaService.problem.findUnique.mockResolvedValue(problem);
      mockPrismaService.problem.delete.mockResolvedValue(problem);

      await service.remove('1', user.id);

      expect(prisma.submission.deleteMany).toHaveBeenCalledWith({ where: { problemId: '1' } });
      expect(prisma.testCase.deleteMany).toHaveBeenCalledWith({ where: { problemId: '1' } });
      expect(prisma.problemsOnLists.deleteMany).toHaveBeenCalledWith({ where: { problemId: '1' } });
      expect(prisma.interviewQuestion.deleteMany).toHaveBeenCalledWith({ where: { problemId: '1' } });
      expect(prisma.problem.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(dashboardService.invalidateUserCache).toHaveBeenCalledWith(user.id);
    });
  });
});
