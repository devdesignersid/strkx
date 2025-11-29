import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Difficulty, Prisma } from '@prisma/client';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ManageListProblemsDto } from './dto/manage-list-problems.dto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  private async getDemoUser() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });
    if (!user) {
        // Create if not exists for dev convenience
        return this.prisma.user.create({
            data: {
                email: 'demo@example.com',
                name: 'Demo User'
            }
        });
    }
    return user;
  }

  async create(createListDto: CreateListDto, user: any) {
    return this.prisma.list.create({
      data: {
        ...createListDto,
        userId: user.id,
      },
      include: {
        _count: {
          select: { problems: true },
        },
      },
    });
  }

  async findAll(user: any) {

    // 1. Get all lists with all problem IDs (lightweight select)
    const lists = await this.prisma.list.findMany({
      where: { userId: user.id },
      include: {
        problems: {
            select: {
                problemId: true,
                problem: { select: { tags: true } }
            }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Get user's solved problem IDs
    const solvedSubmissions = await this.prisma.submission.findMany({
        where: {
            userId: user.id,
            status: 'ACCEPTED'
        },
        select: { problemId: true },
        distinct: ['problemId']
    });
    const solvedProblemIds = new Set(solvedSubmissions.map(s => s.problemId));

    // 3. Map and compute
    return lists.map(list => {
        const problemIds = list.problems.map(p => p.problemId);
        const solvedCount = problemIds.filter(id => solvedProblemIds.has(id)).length;
        const totalCount = problemIds.length;

        return {
            ...list,
            // Keep structure compatible with frontend expectations but limit preview
            problems: list.problems.slice(0, 5),
            _count: { problems: totalCount },
            solvedCount
        };
    });
  }

  async findOne(
    id: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    difficulty?: string,
    status?: string,
    tags?: string,
    sort?: string,
    order?: 'asc' | 'desc',
    user?: any,
  ) {
    if (!user) {
      throw new NotFoundException('User not authenticated');
    }

    // First check if list exists and get metadata
    const listMetadata = await this.prisma.list.findUnique({
      where: { id },
    });

    if (!listMetadata) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }

    // Build Filters
    const problemWhere: Prisma.ProblemWhereInput = {};

    if (search) {
      problemWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (difficulty) {
      problemWhere.difficulty = { in: difficulty.split(',') as Difficulty[] };
    }
    if (tags) {
      problemWhere.tags = { hasSome: tags.split(',') };
    }
    if (status) {
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
        problemWhere.AND = [{ OR: statusConditions }];
      }
    }

    const where: Prisma.ProblemsOnListsWhereInput = {
      listId: id,
      problem: problemWhere,
    };

    // Fetch ALL matching problems (for in-memory sort/paginate)
    const problemsOnList = await this.prisma.problemsOnLists.findMany({
      where,
      include: {
        problem: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    // Fetch user submissions for these problems
    const problemIds = problemsOnList.map((p) => p.problemId);
    const submissions = await this.prisma.submission.findMany({
      where: {
        userId: user.id,
        problemId: { in: problemIds },
      },
      select: {
        problemId: true,
        status: true,
      },
    });

    // Map status
    const statusMap = new Map<string, string>();
    submissions.forEach((s) => {
      const current = statusMap.get(s.problemId);
      if (s.status === 'ACCEPTED') {
        statusMap.set(s.problemId, 'Solved');
      } else if (current !== 'Solved') {
        statusMap.set(s.problemId, 'Attempted');
      }
    });

    // Enrich problems with status
    const enrichedProblems = problemsOnList.map((p) => ({
      ...p,
      problem: {
        ...p.problem,
        status: statusMap.get(p.problemId) || 'Todo',
      },
    }));

    // Sort (In-Memory)
    if (sort) {
      const sortOrder = order === 'desc' ? -1 : 1;
      enrichedProblems.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sort === 'title') {
          valA = a.problem.title;
          valB = b.problem.title;
        } else if (sort === 'difficulty') {
          const diffMap = { Easy: 1, Medium: 2, Hard: 3 };
          valA = diffMap[a.problem.difficulty];
          valB = diffMap[b.problem.difficulty];
        } else if (sort === 'status') {
          const statusMapVal = { Todo: 1, Attempted: 2, Solved: 3 };
          valA = statusMapVal[a.problem.status];
          valB = statusMapVal[b.problem.status];
        } else {
          valA = (a.problem as any)[sort];
          valB = (b.problem as any)[sort];
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
      ...listMetadata,
      problems: paginatedProblems,
      total,
      page,
      limit,
      hasMore: skip + paginatedProblems.length < total,
    };
  }

  async update(id: string, updateListDto: UpdateListDto, user: any) {
    // Verify list belongs to user
    const list = await this.prisma.list.findFirst({
      where: { id, userId: user.id },
    });
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return this.prisma.list.update({
      where: { id },
      data: updateListDto,
    });
  }

  async remove(id: string, user: any) {
    // Verify list belongs to user
    const list = await this.prisma.list.findFirst({
      where: { id, userId: user.id },
    });
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return this.prisma.list.delete({
      where: { id },
    });
  }

  async addProblems(id: string, dto: ManageListProblemsDto, user: any) {
    const list = await this.findOne(id, 1, 20, undefined, undefined, undefined, undefined, undefined, undefined, user); // Ensure list exists and belongs to user

    // Create many ProblemsOnLists
    // Prisma createMany is supported
    const data = dto.problemIds.map(problemId => ({
        listId: id,
        problemId: problemId
    }));

    // We use createMany with skipDuplicates to handle idempotency
    return this.prisma.problemsOnLists.createMany({
        data,
        skipDuplicates: true
    });
  }

  async removeProblems(id: string, dto: ManageListProblemsDto, user: any) {
    await this.findOne(id, 1, 20, undefined, undefined, undefined, undefined, undefined, undefined, user); // Ensure list exists and belongs to user
    return this.prisma.problemsOnLists.deleteMany({
        where: {
            listId: id,
            problemId: {
                in: dto.problemIds
            }
        }
    });
  }
}
