import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('InterviewSessions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sessionId: string;
  let questionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Ensure we have a user and problems
    await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: { email: 'demo@example.com', name: 'Demo User' }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/interview-sessions (POST) - Create Session', async () => {
    const response = await request(app.getHttpServer())
      .post('/interview-sessions')
      .send({
        difficulty: ['Easy', 'Medium'],
        questionCount: 1,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.questions).toHaveLength(1);
    sessionId = response.body.id;
    questionId = response.body.questions[0].id;
  });

  it('/interview-sessions/:id (GET) - Get Session', () => {
    return request(app.getHttpServer())
      .get(`/interview-sessions/${sessionId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(sessionId);
      });
  });

  it('/interview-sessions/:id/questions/:qId/submit (POST) - Submit Answer', async () => {
    const response = await request(app.getHttpServer())
      .post(`/interview-sessions/${sessionId}/questions/${questionId}/submit`)
      .send({
        code: 'console.log("hello")',
        language: 'javascript',
        status: 'ACCEPTED',
      })
      .expect(201);

    expect(response.body).toHaveProperty('submission');
    expect(response.body.submission.status).toBe('ACCEPTED');
  });

  it('/interview-sessions/:id/complete (POST) - Complete Session', () => {
    return request(app.getHttpServer())
      .post(`/interview-sessions/${sessionId}/complete`)
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('COMPLETED');
      });
  });
});
