import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDb } from '../utils/test-db';
import { AuthHelper } from '../utils/auth-helper';
import cookieParser from 'cookie-parser';

describe('Authentication (E2E)', () => {
  let app: INestApplication;
  let testDb: TestDb;
  let authHelper: AuthHelper;

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
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    await app.close();
    await testDb.stop();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  describe('/auth/me (GET)', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return user profile if authenticated', async () => {
      const user = await authHelper.createTestUser();
      const cookie = authHelper.getAuthCookie(user);

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [cookie])
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(user.id);
          expect(res.body.email).toBe(user.email);
        });
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should clear authentication cookie', async () => {
      const user = await authHelper.createTestUser();
      const cookie = authHelper.getAuthCookie(user);

      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [cookie])
        .expect(200)
        .expect((res) => {
          const cookies = res.get('Set-Cookie');
          expect(cookies).toBeDefined();
          expect(cookies?.some((c) => c.includes('Authentication=;'))).toBe(true);
        });
    });
  });
});
