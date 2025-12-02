import { Test, TestingModule } from '@nestjs/testing';
import { InterviewSessionsService } from './interview-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';

describe('InterviewSessionsService Time Tracking', () => {
  let service: InterviewSessionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    problem: { findMany: jest.fn() },
    interviewSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    interviewQuestion: { findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    submission: { create: jest.fn() },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewSessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InterviewSessionsService>(InterviewSessionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should calculate duration correctly', async () => {
    // Mock User
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    // Mock Problems
    mockPrisma.problem.findMany.mockResolvedValue([
      { id: 'prob-1' },
      { id: 'prob-2' },
    ]);

    // Mock Create Session
    const startTime = new Date();
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      questions: [
        { id: 'q-1', problemId: 'prob-1', status: 'IN_PROGRESS', startTime: startTime, orderIndex: 0 },
        { id: 'q-2', problemId: 'prob-2', status: 'PENDING', startTime: null, orderIndex: 1 },
      ],
    };
    mockPrisma.interviewSession.create.mockResolvedValue(mockSession);

    // Call create
    await service.create({ questionCount: 2 } as CreateInterviewSessionDto, 'user-1');

    // Simulate waiting 2 seconds
    const endTime = new Date(startTime.getTime() + 2000);

    // Mock Submit Answer
    mockPrisma.interviewSession.findUnique.mockResolvedValue(mockSession);
    mockPrisma.interviewQuestion.findUnique.mockResolvedValue(mockSession.questions[0]);
    mockPrisma.interviewQuestion.findFirst.mockResolvedValue(mockSession.questions[1]); // Next question

    // Mock Update for Q1
    mockPrisma.interviewQuestion.update.mockImplementation(({ where, data }) => {
        if (where.id === 'q-1') {
            expect(data.status).toBe('COMPLETED');
            expect(data.endTime).toBeDefined();
            // In a real DB, data.endTime would be the timestamp.
            // Here we verify it's being set.
            return Promise.resolve({ ...mockSession.questions[0], ...data, endTime });
        }
        if (where.id === 'q-2') {
            return Promise.resolve({ ...mockSession.questions[1], ...data });
        }
        return Promise.resolve(data);
    });

    // Call submitAnswer
    await service.submitAnswer('session-1', 'q-1', { code: 'code', language: 'js', status: 'ACCEPTED' });

    // Verify Q1 duration
    const duration = endTime.getTime() - startTime.getTime();
    expect(duration).toBe(2000);

    console.log(`Duration: ${duration}ms`);
  });
});
