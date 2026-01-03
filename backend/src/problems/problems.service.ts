import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PaginationDto, SortOrder } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ExecutionService } from '../execution/execution.service';
import { Difficulty, Prisma } from '@prisma/client';

@Injectable()
export class ProblemsService {
  constructor(
    private prisma: PrismaService,
    private dashboardService: DashboardService,
    private executionService: ExecutionService,
  ) { }

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
    let problems;
    let total;

    // Special handling for Status sorting (In-Memory Sort)
    if (sortBy === 'status' && user) {
      // 1. Fetch minimal data identifying status for ALL matching problems (filtered by search/tags/difficulty)
      const allMatchingProblems = await this.prisma.problem.findMany({
        where,
        select: {
          id: true,
          submissions: {
            where: { userId: user.id },
            select: { status: true }
          }
        }
      });

      total = allMatchingProblems.length;

      // 2. Calculate rank for each problem
      // Rank: 3=Solved, 2=Attempted, 1=Todo
      const rankedProblems = allMatchingProblems.map(p => {
        const hasAccepted = p.submissions.some(s => s.status === 'ACCEPTED');
        const hasAny = p.submissions.length > 0;
        let rank = 1; // Todo
        if (hasAccepted) rank = 3; // Solved
        else if (hasAny) rank = 2; // Attempted

        return { id: p.id, rank };
      });

      // 3. Sort in memory
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      rankedProblems.sort((a, b) => (a.rank - b.rank) * multiplier);

      // 4. Slice for pagination
      const slicedIds = rankedProblems.slice(skip, skip + limit).map(p => p.id);

      // 5. Fetch full data for the sliced IDs
      // We must fetch them in a way that preserves our sorted order?
      // Prisma `in` implementation doesn't guarantee order.
      // So we fetch them, then re-sort the result array to match `slicedIds` order.
      const pageProblems = await this.prisma.problem.findMany({
        where: { id: { in: slicedIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          type: true,
          submissions: {
            where: { userId: user.id },
            select: { status: true },
            distinct: ['status']
          }
        }
      });

      // Re-sort pageProblems to match slicedIds order
      problems = slicedIds.map(id => pageProblems.find(p => p.id === id)).filter(Boolean);

    } else {
      // Standard DB-level sorting
      [problems, total] = await this.prisma.$transaction([
        this.prisma.problem.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            tags: true,
            createdAt: true,
            type: true,
            submissions: {
              where: { userId: user.id },
              select: { status: true },
              distinct: ['status']
            }
          }
        }),
        this.prisma.problem.count({ where }),
      ]);
    }

    // Map to enrich status for frontend
    const enrichedProblems = problems.map((p) => {
      let problemStatus = 'Todo';
      // Safe check for submissions existence
      const userSubmissions = p.submissions || [];

      const hasAccepted = userSubmissions.some(s => s.status === 'ACCEPTED');
      const hasAny = userSubmissions.length > 0;

      if (hasAccepted) problemStatus = 'Solved';
      else if (hasAny) problemStatus = 'Attempted';

      return {
        ...p,
        status: problemStatus,
        submissions: undefined, // Remove from output
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
      // Invalidate execution cache so new test cases are used
      this.executionService.invalidateProblemCache(problem.slug, userId);
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

    // Use transaction to ensure data integrity
    const deletedProblem = await this.prisma.$transaction(async (tx) => {
      // First, delete related submissions
      await tx.submission.deleteMany({
        where: { problemId: id },
      });
      // Then, delete related test cases
      await tx.testCase.deleteMany({
        where: { problemId: id },
      });
      // Delete related list entries
      await tx.problemsOnLists.deleteMany({
        where: { problemId: id },
      });
      // Delete related interview questions
      await tx.interviewQuestion.deleteMany({
        where: { problemId: id },
      });
      // Finally, delete the problem
      return tx.problem.delete({
        where: { id },
      });
    });

    // Invalidate user's dashboard cache
    if (this.dashboardService) {
      this.dashboardService.invalidateUserCache(userId);
    }

    return deletedProblem;
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
        // Removed output - only fetch when viewing specific submission
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
