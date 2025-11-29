import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDb } from '../utils/test-db';
import { AuthHelper } from '../utils/auth-helper';
import cookieParser from 'cookie-parser';
import { CreateProblemDto } from '../../src/problems/dto/create-problem.dto';
import { Difficulty } from '@prisma/client';

describe('Problems (E2E)', () => {
  let app: INestApplication;
  let testDb: TestDb;
  let authHelper: AuthHelper;
  let user: any;
  let cookie: string;

  beforeAll(async () => {
    testDb = new TestDb();
    await testDb.start();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    authHelper = new AuthHelper(testDb.getPrisma());
  }, 60000);

  afterAll(async () => {
    await app.close();
    await testDb.stop();
  });

  beforeEach(async () => {
    await testDb.reset();
    user = await authHelper.createTestUser();
    cookie = authHelper.getAuthCookie(user);
  });

  describe('/problems (POST)', () => {
    it('should create a problem', () => {
      const dto: CreateProblemDto = {
        title: 'E2E Problem',
        slug: 'e2e-problem',
        description: 'Desc',
        difficulty: Difficulty.Medium,
        tags: ['e2e'],
        testCases: [{ input: '1', expectedOutput: '1', isHidden: false }],
      };

      return request(app.getHttpServer())
        .post('/problems')
        .set('Cookie', [cookie])
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.slug).toBe(dto.slug);
        });
    });

    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .post('/problems')
        .send({})
        .expect(401);
    });
  });

  describe('/problems (GET)', () => {
    it('should return list of problems', async () => {
      await request(app.getHttpServer())
        .post('/problems')
        .set('Cookie', [cookie])
        .send({
          title: 'P1', slug: 'p1', description: 'D', difficulty: 'Easy', tags: [], testCases: []
        });

      return request(app.getHttpServer())
        .get('/problems')
        .set('Cookie', [cookie])
        .expect(200)
        .expect((res) => {
          expect(res.body.problems).toHaveLength(1);
          expect(res.body.problems[0].slug).toBe('p1');
        });
    });
  });

  describe('/problems/:slug (GET)', () => {
    it('should return problem details', async () => {
      await request(app.getHttpServer())
        .post('/problems')
        .set('Cookie', [cookie])
        .send({
          title: 'P1', slug: 'p1', description: 'D', difficulty: 'Easy', tags: [], testCases: []
        });

      return request(app.getHttpServer())
        .get('/problems/p1')
        .set('Cookie', [cookie])
        .expect(200)
        .expect((res) => {
          expect(res.body.slug).toBe('p1');
        });
    });

    it('should return 404 if not found', () => {
      return request(app.getHttpServer())
        .get('/problems/non-existent')
        .set('Cookie', [cookie])
        .expect(404);
    });
  });

  describe('/problems/:id (DELETE)', () => {
    it('should delete problem', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/problems')
        .set('Cookie', [cookie])
        .send({
          title: 'To Delete', slug: 'delete-me', description: 'D', difficulty: 'Easy', tags: [], testCases: []
        });

      const id = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/problems/${id}`)
        .set('Cookie', [cookie])
        .expect(200);

      return request(app.getHttpServer())
        .get(`/problems/delete-me`)
        .set('Cookie', [cookie])
        .expect(404);
    });
  });
});
