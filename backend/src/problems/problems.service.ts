import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PaginationDto, SortOrder } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Difficulty, Prisma } from '@prisma/client';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

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
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc', skip, take } = paginationDto;

    // Enforce max limit
    const maxLimit = 100;
    const effectiveLimit = Math.min(limit, maxLimit);

    // Recalculate take if necessary (though paginationDto might have handled it, better to be safe)
    // Actually, skip and take are derived from page/limit in the DTO transformation usually,
    // but here we are using them directly.
    // If we change limit, we should update take.
    // However, the code uses `slice(skip, skip + take)` later.
    // Let's just override limit and ensure we use effectiveLimit for slicing.

    // Wait, the code uses `skip` and `take` from paginationDto.
    // If I change limit, I need to ensure `take` is also updated if it was derived from limit.
    // Let's assume we should use effectiveLimit.

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
          submissions: {
            some: { userId: user.id, status: { not: 'ACCEPTED' } },
            none: { userId: user.id, status: 'ACCEPTED' },
          },
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

    // Fetch ALL matching problems (for in-memory sort/paginate)
    const allProblems = await this.prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with Status
    let enrichedProblems: any[] = [];
    if (user) {
      const submissions = await this.prisma.submission.findMany({
        where: { userId: user.id },
        select: { problemId: true, status: true },
      });
      const statusMap = new Map<string, string>();
      submissions.forEach((s) => {
        if (s.status === 'ACCEPTED') {
          statusMap.set(s.problemId, 'Solved');
        } else if (!statusMap.has(s.problemId)) {
          statusMap.set(s.problemId, 'Attempted');
        }
      });
      enrichedProblems = allProblems.map((p) => ({
        ...p,
        status: statusMap.get(p.id) || 'Todo',
      }));
    } else {
      enrichedProblems = allProblems.map((p) => ({ ...p, status: 'Todo' }));
    }

    // Sort (In-Memory)
    if (sortBy) {
      const sortKey = sortBy as keyof typeof enrichedProblems[0];
      const direction = sortOrder === SortOrder.DESC ? -1 : 1;

      enrichedProblems.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Custom Sorts
        if (sortKey === 'difficulty') {
          const diffMap = { Easy: 1, Medium: 2, Hard: 3 };
          valA = diffMap[a.difficulty];
          valB = diffMap[b.difficulty];
        } else if (sortKey === 'status') {
          const statusMap = { Todo: 1, Attempted: 2, Solved: 3 };
          valA = statusMap[a.status];
          valB = statusMap[b.status];
        }

        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
      });
    }

    // Paginate
    const total = enrichedProblems.length;
    // We need to recalculate skip/take based on effectiveLimit if we want to be consistent
    const effectiveSkip = (page - 1) * effectiveLimit;
    const paginatedProblems = enrichedProblems.slice(effectiveSkip, effectiveSkip + effectiveLimit);

    return {
      problems: paginatedProblems,
      total,
      page,
      limit: effectiveLimit,
      hasMore: effectiveSkip + paginatedProblems.length < total,
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
