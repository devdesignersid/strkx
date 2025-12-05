import { Test, TestingModule } from '@nestjs/testing';
import { ProblemsService } from '../../src/problems/problems.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDb } from '../utils/test-db';
import { AuthHelper } from '../utils/auth-helper';
import { CreateProblemDto, Difficulty } from '../../src/problems/dto/create-problem.dto';

describe('ProblemsService (Integration)', () => {
  let service: ProblemsService;
  let testDb: TestDb;
  let authHelper: AuthHelper;
  let user: any;

  beforeAll(async () => {
    testDb = new TestDb();
    await testDb.start();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemsService,
        { provide: PrismaService, useValue: testDb.getPrisma() },
      ],
    }).compile();

    service = module.get<ProblemsService>(ProblemsService);
    authHelper = new AuthHelper(testDb.getPrisma());
  }, 60000);

  afterAll(async () => {
    await testDb.stop();
  });

  beforeEach(async () => {
    await testDb.reset();
    user = await authHelper.createTestUser();
  });

  describe('create', () => {
    it('should create a problem and persist it', async () => {
      const dto: CreateProblemDto = {
        title: 'Integration Test Problem',
        slug: 'integration-test-problem',
        description: 'Description',
        difficulty: Difficulty.Medium,
        tags: ['dp'],
        testCases: [{ input: '1', expectedOutput: '1' }],
      };

      const result = await service.create(dto, user);
      expect(result.id).toBeDefined();
      expect(result.testCases).toHaveLength(1);

      const saved = await testDb.getPrisma().problem.findUnique({
        where: { id: result.id },
        include: { testCases: true },
      });
      expect(saved).toBeDefined();
      expect(saved?.slug).toBe(dto.slug);
    });

    it('should fail on duplicate slug', async () => {
      const dto: CreateProblemDto = {
        title: 'P1',
        slug: 'duplicate-slug',
        description: 'D1',
        difficulty: Difficulty.Easy,
        tags: [],
        testCases: [],
      };

      await service.create(dto, user);
      await expect(service.create(dto, user)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should filter by difficulty using DB query', async () => {
      await service.create({
        title: 'Easy P', slug: 'easy-p', description: 'D', difficulty: Difficulty.Easy, tags: [], testCases: []
      }, user);
      await service.create({
        title: 'Hard P', slug: 'hard-p', description: 'D', difficulty: Difficulty.Hard, tags: [], testCases: []
      }, user);

      const paginationDto = { page: 1, limit: 10, skip: 0, take: 10 } as any;
      const result = await service.findAll(paginationDto, 'Easy', undefined, undefined, user);
      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].title).toBe('Easy P');
    });
  });

  describe('remove', () => {
    it('should cascade delete test cases', async () => {
      const problem = await service.create({
        title: 'To Delete', slug: 'delete-me', description: 'D', difficulty: Difficulty.Easy, tags: [],
        testCases: [{ input: '1', expectedOutput: '1' }]
      }, user);

      await service.remove(problem.id, user.id);

      const savedProblem = await testDb.getPrisma().problem.findUnique({ where: { id: problem.id } });
      expect(savedProblem).toBeNull();

      const savedTestCases = await testDb.getPrisma().testCase.findMany({ where: { problemId: problem.id } });
      expect(savedTestCases).toHaveLength(0);
    });
  });
});
