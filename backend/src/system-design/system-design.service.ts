import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { SYSTEM_DESIGN_CONSTANTS, DEMO_USER_EMAIL } from '../common/constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Difficulty, Prisma } from '@prisma/client';
import { CreateSystemDesignProblemDto, UpdateSystemDesignProblemDto } from './dto/create-problem.dto';
import { CreateSystemDesignSubmissionDto, UpdateSystemDesignSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SystemDesignService {
  constructor(
    private prisma: PrismaService,
    private dashboardService: DashboardService
  ) { }

  async createProblem(userId: string, data: CreateSystemDesignProblemDto) {
    return this.prisma.systemDesignProblem.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async getDemoUserId() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });
    return user?.id || 'demo-user';
  }

  async findAll(
    userId: string,
    paginationDto: PaginationDto,
    difficulty?: string,
    status?: string,
    tags?: string,
  ) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.SystemDesignProblemWhereInput = {
      userId,
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
    if (status) {
      const statuses = status.split(',');
      const statusConditions: Prisma.SystemDesignProblemWhereInput[] = [];

      if (statuses.includes('Solved')) {
        statusConditions.push({
          submissions: { some: { userId: userId, isSolution: true } },
        });
      }
      if (statuses.includes('Attempted')) {
        statusConditions.push({
          AND: [
            { submissions: { some: { userId: userId } } },
            { submissions: { none: { userId: userId, isSolution: true } } },
            { submissions: { some: { status: 'completed' } } } // System design 'Attempted' logic might differ slightly, but mapping based on service logic
          ],
        });
      }
      if (statuses.includes('Todo')) {
        statusConditions.push({
          submissions: { none: { userId: userId } },
        });
      }

      if (statusConditions.length > 0) {
        where.AND = [{ OR: statusConditions }];
      }
    }

    // Determine Order
    let orderBy: Prisma.SystemDesignProblemOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy) {
      if (sortBy === 'title') {
        orderBy = { title: sortOrder === 'asc' ? 'asc' : 'desc' };
      } else if (sortBy === 'difficulty') {
        orderBy = { difficulty: sortOrder === 'asc' ? 'asc' : 'desc' };
      } else {
        orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
      }
    }

    let problems;
    let total;

    // Special handling for Status sorting (In-Memory Sort)
    if (sortBy === 'status') {
      // 1. Fetch minimal data identifying status for ALL matching problems
      const allMatchingProblems = await this.prisma.systemDesignProblem.findMany({
        where,
        select: {
          id: true,
          submissions: {
            where: { userId },
            select: { status: true, isSolution: true }
          }
        }
      });

      total = allMatchingProblems.length;

      // 2. Calculate rank for each problem
      // Rank: 3=Solved, 2=Attempted, 1=Todo
      const rankedProblems = allMatchingProblems.map(p => {
        const hasSolution = p.submissions.some(s => s.isSolution);
        const hasCompleted = p.submissions.some(s => s.status === 'completed');
        let rank = 1; // Todo
        if (hasSolution) rank = 3; // Solved
        else if (hasCompleted) rank = 2; // Attempted

        return { id: p.id, rank };
      });

      // 3. Sort in memory
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      rankedProblems.sort((a, b) => (a.rank - b.rank) * multiplier);

      // 4. Slice for pagination
      const slicedIds = rankedProblems.slice(skip, skip + limit).map(p => p.id);

      // 5. Fetch full data for the sliced IDs
      const pageProblems = await this.prisma.systemDesignProblem.findMany({
        where: { id: { in: slicedIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { submissions: true },
          },
          submissions: {
            where: { userId },
            select: { id: true, status: true, isSolution: true },
          },
        }
      });

      // Re-sort pageProblems to match slicedIds order
      problems = slicedIds.map(id => pageProblems.find(p => p.id === id)).filter(Boolean);

    } else {
      // Standard DB-level sorting
      [problems, total] = await this.prisma.$transaction([
        this.prisma.systemDesignProblem.findMany({
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
            updatedAt: true,
            _count: {
              select: { submissions: true },
            },
            submissions: {
              where: { userId },
              select: { id: true, status: true, isSolution: true },
            },
          },
        }),
        this.prisma.systemDesignProblem.count({ where }),
      ]);
    }

    // Map problems with derived status
    const enrichedProblems = problems.map(problem => {
      const hasSolution = problem.submissions.some(s => s.isSolution);
      const hasCompleted = problem.submissions.some(s => s.status === 'completed');

      let status = 'Todo';
      if (hasSolution) {
        status = 'Solved';
      } else if (hasCompleted) {
        status = 'Attempted';
      }

      return {
        ...problem,
        status,
        submissions: undefined,
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

  async findOne(idOrSlug: string) {
    // Check if input is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

    const problem = await this.prisma.systemDesignProblem.findFirst({
      where,
      include: {
        solutions: {
          select: {
            id: true,
            title: true,
            description: true,
            author: true,
            createdAt: true,
            diagramSnapshot: true,
            // Exclude excalidrawJson for list view to improve performance
          },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException(`System Design problem with ID/Slug ${idOrSlug} not found`);
    }

    return problem;
  }

  async updateProblem(id: string, data: UpdateSystemDesignProblemDto) {
    return this.prisma.systemDesignProblem.update({
      where: { id },
      data,
    });
  }

  async deleteProblem(id: string) {
    // First check if problem exists
    const problem = await this.prisma.systemDesignProblem.findUnique({
      where: { id },
    });

    if (!problem) {
      throw new NotFoundException(`System Design problem with ID ${id} not found`);
    }

    // Use transaction for atomic deletion
    const deletedProblem = await this.prisma.$transaction(async (tx) => {
      // 1. Delete all submissions for this problem
      await tx.systemDesignSubmission.deleteMany({
        where: { problemId: id },
      });

      // 2. Delete all solutions linked to this problem
      await tx.systemDesignSolution.deleteMany({
        where: { problemId: id },
      });

      // 3. Remove from any lists
      await tx.systemDesignProblemsOnLists.deleteMany({
        where: { problemId: id },
      });

      // 4. Finally delete the problem itself
      return tx.systemDesignProblem.delete({
        where: { id },
      });
    });

    // Invalidate dashboard cache for the user
    if (this.dashboardService) {
      this.dashboardService.invalidateUserCache(problem.userId);
    }

    return deletedProblem;
  }

  // Submissions
  async createSubmission(data: CreateSystemDesignSubmissionDto & { user: { connect: { id: string } }, problem: { connect: { id: string } } }) {
    const { problemId, user, problem, ...rest } = data;
    return this.prisma.systemDesignSubmission.create({
      data: {
        ...rest,
        user,
        problem,
      },
    });
  }

  async updateSubmission(id: string, data: UpdateSystemDesignSubmissionDto) {
    return this.prisma.systemDesignSubmission.update({
      where: { id },
      data,
    });
  }

  async deleteSubmission(id: string) {
    return this.prisma.systemDesignSubmission.delete({
      where: { id },
    });
  }

  async findUserSubmissions(userId: string, idOrSlug: string) {
    let problemId = idOrSlug;

    // Check if input is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    if (!isUuid) {
      const problem = await this.prisma.systemDesignProblem.findFirst({
        where: { slug: idOrSlug },
        select: { id: true }
      });
      if (!problem) {
        throw new NotFoundException(`System Design problem with slug ${idOrSlug} not found`);
      }
      problemId = problem.id;
    }

    return this.prisma.systemDesignSubmission.findMany({
      where: {
        problemId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSubmission(id: string) {
    const submission = await this.prisma.systemDesignSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async analyzeSubmission(id: string) {
    const submission = await this.findSubmission(id);

    // TODO: Integrate with actual AI service (Gemini/OpenAI)
    // For now, return mock analysis based on the problem
    const mockAnalysis = {
      score: SYSTEM_DESIGN_CONSTANTS.DEFAULT_ANALYSIS_SCORE,
      summary: SYSTEM_DESIGN_CONSTANTS.DEFAULT_ANALYSIS_SUMMARY,
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    // Update submission with score only
    return this.prisma.systemDesignSubmission.update({
      where: { id },
      data: {
        score: mockAnalysis.score,
        status: 'completed', // Mark as completed when analysis is done
      }
    });
  }

  async markSubmissionAsSolution(id: string, solutionName?: string) {
    // Find the submission
    const submission = await this.prisma.systemDesignSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    // Toggle isSolution status
    const updatedSubmission = await this.prisma.systemDesignSubmission.update({
      where: { id },
      data: {
        isSolution: !submission.isSolution,
        solutionName: !submission.isSolution ? (solutionName || null) : null
      },
    });

    // If marking as solution, unmark all other submissions for this problem
    if (updatedSubmission.isSolution) {
      await this.prisma.systemDesignSubmission.updateMany({
        where: {
          problemId: submission.problemId,
          id: { not: id },
        },
        data: { isSolution: false, solutionName: null },
      });
    }

    return updatedSubmission;
  }
}
