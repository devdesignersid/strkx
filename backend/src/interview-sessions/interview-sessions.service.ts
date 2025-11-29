import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto';
import { Difficulty, Prisma } from '@prisma/client';

@Injectable()
export class InterviewSessionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateInterviewSessionDto) {
    // TODO: Get actual user from auth context. For now, use demo user.
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) throw new NotFoundException('User not found');

    const { difficulty, status, tags, lists, questionCount = 2 } = createDto;

    // 1. Build Filter Query
    const where: Prisma.ProblemWhereInput = {};

    if (difficulty && difficulty.length > 0) {
      where.difficulty = { in: difficulty as Difficulty[] };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Lists filter
    if (lists && lists.length > 0) {
        where.lists = {
            some: {
                listId: { in: lists }
            }
        };
    }

    // Status Filter
    if (status && status.length > 0) {
      const statusConditions: Prisma.ProblemWhereInput[] = [];
      if (status.includes('Solved')) {
        statusConditions.push({ submissions: { some: { userId: user.id, status: 'ACCEPTED' } } });
      }
      if (status.includes('Attempted')) {
        statusConditions.push({
          submissions: {
            some: { userId: user.id, status: { not: 'ACCEPTED' } },
            none: { userId: user.id, status: 'ACCEPTED' },
          },
        });
      }
      if (status.includes('Todo')) { // Unsolved
         statusConditions.push({ submissions: { none: { userId: user.id } } });
      }

      if (statusConditions.length > 0) {
          where.AND = [{ OR: statusConditions }];
      }
    }

    // 2. Fetch Matching Problem IDs
    const matchingProblems = await this.prisma.problem.findMany({
      where,
      select: { id: true },
    });

    if (matchingProblems.length < questionCount) {
      throw new BadRequestException(
        `Not enough questions found matching criteria. Found ${matchingProblems.length}, requested ${questionCount}.`,
      );
    }

    // 3. Random Selection
    const shuffled = matchingProblems.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, questionCount);

    // 4. Create Session
    return this.prisma.interviewSession.create({
      data: {
        userId: user.id,
        difficulty: difficulty || [],
        statusFilter: status || [],
        tags: tags || [],
        lists: lists || [],
        questionCount,
        questions: {
          create: selected.map((p, index) => ({
            problemId: p.id,
            orderIndex: index,
            status: index === 0 ? 'IN_PROGRESS' : 'PENDING', // First question starts immediately
            startTime: index === 0 ? new Date() : null,
          })),
        },
      },
      include: {
        questions: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                description: true,
                starterCode: true,
                testCases: { where: { isHidden: false } },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                description: true,
                starterCode: true,
                testCases: { where: { isHidden: false } },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!session) throw new NotFoundException(`Session ${id} not found`);

    return session;
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    submitDto: SubmitInterviewAnswerDto,
  ) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!session) throw new NotFoundException('Session not found');

    return this.prisma.$transaction(async (tx) => {
      // Re-fetch session within transaction to lock/ensure latest state?
      // Prisma doesn't support row locking easily without raw queries, but transaction ensures atomicity.
      // Ideally we'd use optimistic concurrency or raw SELECT FOR UPDATE.
      // For now, we rely on the check.

      const q = await tx.interviewQuestion.findUnique({
          where: { id: questionId },
          include: { interviewSession: true } // verify session ownership if needed
      });

      if (!q) throw new NotFoundException('Question not found');
      if (q.status === 'COMPLETED') {
          throw new BadRequestException('Question already completed');
      }

      // 1. Create Submission
      const submission = await tx.submission.create({
        data: {
          code: submitDto.code,
          language: submitDto.language,
          status: submitDto.status,
          output: submitDto.output || '',
          userId: session.userId,
          problemId: q.problemId,
          interviewQuestionId: q.id,
        },
      });

      // 2. Update Question Status
      const outcome = submitDto.status === 'ACCEPTED' ? 'PASSED' : 'FAILED';
      await tx.interviewQuestion.update({
        where: { id: questionId },
        data: {
          status: 'COMPLETED',
          outcome,
          endTime: new Date(),
          autoSubmitted: submitDto.autoSubmitted || false,
        },
      });

      // 3. Handle Transition
      const currentOrder = q.orderIndex;
      // We need to find the next question. We can't use 'session.questions' from outside tx reliably if we want to be super safe,
      // but orderIndex shouldn't change.
      const nextQuestion = await tx.interviewQuestion.findFirst({
          where: {
              interviewSessionId: sessionId,
              orderIndex: currentOrder + 1
          }
      });

      if (nextQuestion) {
        // Start next question
        await tx.interviewQuestion.update({
          where: { id: nextQuestion.id },
          data: {
            status: 'IN_PROGRESS',
            startTime: new Date(),
          },
        });
      } else {
        // End Session
        await tx.interviewSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            endTime: new Date(),
          },
        });
      }

      return { submission, nextQuestionId: nextQuestion?.id || null };
    });
  }

  async completeSession(id: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id },
    });

    if (!session) throw new NotFoundException('Session not found');

    if (session.status === 'COMPLETED') return session;

    return this.prisma.interviewSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    });
  }
}
