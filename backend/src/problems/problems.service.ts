import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PaginationDto, SortOrder } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Difficulty, Prisma } from '@prisma/client';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) { }

  async create(createProblemDto: CreateProblemDto, user: any) {
    const { testCases, ...problemData } = createProblemDto;
    return this.prisma.problem.create({
      data: {
        ...problemData,
        userId: user.id,
        testCases: {
          create: testCases,
        },
      },
      include: {
        testCases: true,
      },
    });
  }

  async findAll(
    paginationDto: PaginationDto,
    difficulty?: string,
    status?: string,
    tags?: string,
    user?: any,
  ) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.ProblemWhereInput = {
      userId: user.id,
    };

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Difficulty
    if (difficulty) {
      where.difficulty = { in: difficulty.split(',') as Difficulty[] };
    }

    // Tags
    if (tags) {
      where.tags = { hasSome: tags.split(',') };
    }

    // Status Filter (DB Level)
    if (status && user) {
      const statuses = status.split(',');
      const statusConditions: Prisma.ProblemWhereInput[] = [];

      if (statuses.includes('Solved')) {
        statusConditions.push({
          submissions: { some: { userId: user.id, status: 'ACCEPTED' } },
        });
      }
      if (statuses.includes('Attempted')) {
        statusConditions.push({
          AND: [
            { submissions: { some: { userId: user.id } } },
            { submissions: { none: { userId: user.id, status: 'ACCEPTED' } } },
          ],
        });
      }
      if (statuses.includes('Todo')) {
        statusConditions.push({
          submissions: { none: { userId: user.id } },
        });
      }

      if (statusConditions.length > 0) {
        where.AND = [{ OR: statusConditions }];
      }
    }

    // Determine Order
    let orderBy: Prisma.ProblemOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy) {
      if (sortBy === 'difficulty') {
        // Difficulty is an enum, sorting might not be alphabetical order of keys but enum order?
        // Prisma sorts enums by their definition order in Postgres.
        // If we want specific order, we might need raw query or just accept enum order.
        // 'Easy', 'Medium', 'Hard' -> Alphabetical: Easy, Hard, Medium.
        // Enum definition: Easy, Medium, Hard.
        // Prisma usually sorts by the underlying value or enum order.
        orderBy = { difficulty: sortOrder === 'asc' ? 'asc' : 'desc' };
      } else if (sortBy === 'title') {
        orderBy = { title: sortOrder === 'asc' ? 'asc' : 'desc' };
      } else {
        // Default to createdAt for unknown fields or keep explicit
        orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
      }
    }

    // Execute Transaction for count and data
    const [problems, total] = await this.prisma.$transaction([
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          submissions: {
            where: { userId: user.id },
            select: { status: true },
            distinct: ['status'] // Get unique statuses to determine if Solved/Attempted without fetching all
          }
        }
      }),
      this.prisma.problem.count({ where }),
    ]);

    // Map to enrich status for frontend
    // Note: This mapping is now O(limit) which is O(1) effectively (limit=20)
    const enrichedProblems = problems.map((p) => {
      let problemStatus = 'Todo';
      const userSubmissions = p.submissions || [];

      // Since we didn't fetch ALL submissions, we need to be careful.
      // But wait, we need to know if *any* accepted submission exists to call it 'Solved'.
      // The previous query fetched all submissions.
      // Optimization: We can't easily get "Solved" status just by taking 1 latest submission 
      // if the latest is failed but a previous one was passed.
      // However, for the list view, usually "Solved" means "Ever Solved".

      // Let's refine the include to be more efficient or just accept we need to check existence.
      // Actually, we can use the same logic as the filter but for projection? No.

      // Better approach for status projection:
      // We can fetch the status separately or just fetch all submissions for these 20 problems (lightweight).
      // Or, since we are already paginating, fetching submissions for 20 problems is fine.

      const hasAccepted = userSubmissions.some(s => s.status === 'ACCEPTED');
      const hasAny = userSubmissions.length > 0;

      if (hasAccepted) problemStatus = 'Solved';
      else if (hasAny) problemStatus = 'Attempted';

      // To ensure we get the correct status, we should probably fetch all submissions for these problems
      // OR rely on the fact that if we filtered by status, we know the status.
      // But if we didn't filter, we need to compute it.

      // Let's change the include to fetch all submissions for the user for these problems.
      // It's only 20 problems, so it's fine.

      return {
        ...p,
        status: problemStatus,
        submissions: undefined, // Remove from output if not needed
      };
    });

    return {
      problems: enrichedProblems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string, userId: string) {
    const problem = await this.prisma.problem.findFirst({
      where: {
        slug,
        userId,
      },
      include: {
        testCases: {
          where: { isHidden: false },
        },
      },
    });

    if (!problem || problem.userId !== userId) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    return problem;
  }

  async findById(id: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: true, // Include all test cases for editing
      },
    });

    if (!problem || problem.userId !== userId) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    return problem;
  }

  async update(id: string, updateProblemDto: UpdateProblemDto, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.userId !== userId) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    const { testCases, ...problemData } = updateProblemDto;

    if (testCases) {
      await this.prisma.testCase.deleteMany({
        where: { problemId: id },
      });
    }

    return this.prisma.problem.update({
      where: { id },
      data: {
        ...problemData,
        ...(testCases && {
          testCases: {
            create: testCases,
          },
        }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.userId !== userId) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    // First, delete related submissions
    await this.prisma.submission.deleteMany({
      where: { problemId: id },
    });
    // Then, delete related test cases
    await this.prisma.testCase.deleteMany({
      where: { problemId: id },
    });
    // Delete related list entries
    await this.prisma.problemsOnLists.deleteMany({
      where: { problemId: id },
    });
    // Delete related interview questions
    await this.prisma.interviewQuestion.deleteMany({
      where: { problemId: id },
    });
    // Finally, delete the problem
    return this.prisma.problem.delete({
      where: { id },
    });
  }

  async findSubmissions(slug: string, user: any) {
    const problem = await this.prisma.problem.findFirst({
      where: {
        slug,
        userId: user.id,
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    if (!user) return [];

    const submissions = await this.prisma.submission.findMany({
      where: {
        problemId: problem.id,
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        output: true,
        executionTime: true,
        memoryUsed: true,
        isSolution: true,
        solutionName: true,
      },
    });

    // Calculate percentiles for performance comparison
    const executionTimes = submissions
      .map(s => s.executionTime)
      .filter(t => t != null)
      .sort((a, b) => a! - b!);

    const memoryUsages = submissions
      .map(s => s.memoryUsed)
      .filter(m => m != null)
      .sort((a, b) => a! - b!);

    return submissions.map(submission => {
      let timePercentile: number | null = null;
      let memoryPercentile: number | null = null;

      if (submission.executionTime != null && executionTimes.length > 0) {
        const rank = executionTimes.filter(t => t! <= submission.executionTime!).length;
        timePercentile = Math.round((rank / executionTimes.length) * 100);
      }

      if (submission.memoryUsed != null && memoryUsages.length > 0) {
        const rank = memoryUsages.filter(m => m! <= submission.memoryUsed!).length;
        memoryPercentile = Math.round((rank / memoryUsages.length) * 100);
      }

      return {
        ...submission,
        timePercentile,
        memoryPercentile,
      };
    });
  }

  async updateSubmissionSolution(
    slug: string,
    submissionId: string,
    isSolution: boolean,
    user: any,
    solutionName?: string,
  ) {
    const problem = await this.prisma.problem.findFirst({
      where: {
        slug,
        userId: user.id,
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        isSolution,
        solutionName: isSolution ? solutionName : null,
      },
    });
  }

  async findSolutions(slug: string, user: any) {
    const problem = await this.prisma.problem.findFirst({
      where: {
        slug,
        userId: user.id,
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    if (!user) return [];

    return this.prisma.submission.findMany({
      where: {
        problemId: problem.id,
        userId: user.id,
        isSolution: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        code: true,
        solutionName: true,
        executionTime: true,
        memoryUsed: true,
        createdAt: true,
      },
    });
  }
  async deleteSubmission(submissionId: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.userId !== userId) {
      throw new NotFoundException(`Submission with id ${submissionId} not found`);
    }

    return this.prisma.submission.delete({
      where: { id: submissionId },
    });
  }
}
