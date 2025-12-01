import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthHelper } from '../utils/auth-helper';
import { User } from '@prisma/client';

describe('Dashboard E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: AuthHelper;
  let testUser: User;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    authHelper = new AuthHelper(prisma);

    // Create test user
    testUser = await authHelper.createTestUser('dashboard-test@example.com', 'Dashboard Test User');
    authCookie = authHelper.getAuthCookie(testUser);
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    await app.close();
  });

  describe('GET /dashboard/stats', () => {
    it('should return dashboard stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('solved');
      expect(response.body).toHaveProperty('attempted');
      expect(response.body).toHaveProperty('accuracy');
      expect(response.body).toHaveProperty('streak');
      expect(response.body).toHaveProperty('easy');
      expect(response.body).toHaveProperty('medium');
      expect(response.body).toHaveProperty('hard');
      expect(response.body).toHaveProperty('weeklyChange');
      expect(response.body).toHaveProperty('systemDesignSolved');

      expect(typeof response.body.solved).toBe('number');
      expect(typeof response.body.attempted).toBe('number');
      expect(typeof response.body.accuracy).toBe('number');
    });

    it('should return stats quickly (performance check)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Cookie', authCookie)
        .expect(200);

      const duration = Date.now() - startTime;

      // Should complete in less than 500ms (ideally <100ms)
      expect(duration).toBeLessThan(500);
    });

    it('should benefit from caching on second request', async () => {
      // First request
      const firstStart = Date.now();
      await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Cookie', authCookie)
        .expect(200);
      const firstDuration = Date.now() - firstStart;

      // Second request (should hit cache)
      const secondStart = Date.now();
      await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Cookie', authCookie)
        .expect(200);
      const secondDuration = Date.now() - secondStart;

      // Second request should be significantly faster (cached)
      // Allow some variance, but cached should be at least faster
      expect(secondDuration).toBeLessThanOrEqual(firstDuration);
    });
  });

  describe('GET /dashboard/activity', () => {
    it('should return recent activity', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/activity')
        .set('Cookie', authCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const activity = response.body[0];
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('problemTitle');
        expect(activity).toHaveProperty('problemSlug');
        expect(activity).toHaveProperty('difficulty');
        expect(activity).toHaveProperty('status');
        expect(activity).toHaveProperty('timestamp');
        expect(activity).toHaveProperty('type');
        expect(['coding', 'system-design']).toContain(activity.type);
      }
    });

    it('should return activity quickly', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/dashboard/activity')
        .set('Cookie', authCookie)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('should limit results to max recent activity', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/activity')
        .set('Cookie', authCookie)
        .expect(200);

      // Should not exceed MAX_RECENT_ACTIVITY (5)
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /dashboard/heatmap', () => {
    it('should return heatmap data', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/heatmap')
        .set('Cookie', authCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const heatmapEntry = response.body[0];
        expect(heatmapEntry).toHaveProperty('date');
        expect(heatmapEntry).toHaveProperty('count');
        expect(typeof heatmapEntry.date).toBe('string');
        expect(typeof heatmapEntry.count).toBe('number');

        // Validate date format (YYYY-MM-DD)
        expect(heatmapEntry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should return heatmap quickly', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/dashboard/heatmap')
        .set('Cookie', authCookie)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for /dashboard/stats', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/stats')
        .expect(401);
    });

    it('should require authentication for /dashboard/activity', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/activity')
        .expect(401);
    });

    it('should require authentication for /dashboard/heatmap', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/heatmap')
        .expect(401);
    });
  });
});
