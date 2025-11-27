import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Difficulty, Prisma } from '@prisma/client';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

  async create(createProblemDto: CreateProblemDto) {
    const { testCases, ...problemData } = createProblemDto;
    return this.prisma.problem.create({
      data: {
        ...problemData,
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
    page: number = 1,
    limit: number = 20,
    search?: string,
    difficulty?: string,
    status?: string,
    tags?: string,
    sort?: string,
    order?: 'asc' | 'desc',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    const where: Prisma.ProblemWhereInput = {};

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
    if (sort) {
      const sortKey = sort as keyof typeof enrichedProblems[0];
      const sortOrder = order === 'desc' ? -1 : 1;

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

        if (valA < valB) return -1 * sortOrder;
        if (valA > valB) return 1 * sortOrder;
        return 0;
      });
    }

    // Paginate
    const total = enrichedProblems.length;
    const skip = (page - 1) * limit;
    const paginatedProblems = enrichedProblems.slice(skip, skip + limit);

    return {
      problems: paginatedProblems,
      total,
      page,
      limit,
      hasMore: skip + paginatedProblems.length < total,
    };
  }

  async findOne(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: {
          where: { isHidden: false },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    return problem;
  }

  async findById(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: true, // Include all test cases for editing
      },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with id ${id} not found`);
    }

    return problem;
  }

  async update(id: string, updateProblemDto: UpdateProblemDto) {
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

  async remove(id: string) {
    // First, delete related submissions
    await this.prisma.submission.deleteMany({
      where: { problemId: id },
    });
    // Then, delete related test cases
    await this.prisma.testCase.deleteMany({
      where: { problemId: id },
    });
    // Finally, delete the problem
    return this.prisma.problem.delete({
      where: { id },
    });
  }

  async findSubmissions(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

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
    solutionName?: string,
  ) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
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

  async findSolutions(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug ${slug} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

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
}
