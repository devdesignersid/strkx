import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Difficulty, Prisma } from '@prisma/client';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ManageListProblemsDto } from './dto/manage-list-problems.dto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}



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

  async findAll(user: any, skip: number = 0, take: number = 20, search?: string) {
    const where: Prisma.ListWhereInput = { userId: user.id };
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    // 1. Get all lists with all problem IDs (lightweight select)
    const lists = await this.prisma.list.findMany({
      where,
      include: {
        problems: {
            select: {
                problemId: true,
                problem: { select: { tags: true } }
            }
        },
        systemDesignProblems: {
            select: {
                problemId: true,
                problem: { select: { tags: true } }
            }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
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

    // 3. Get user's completed system design problem IDs
    const completedSystemDesignSubmissions = await this.prisma.systemDesignSubmission.findMany({
        where: {
            userId: user.id,
            status: 'completed'
        },
        select: { problemId: true },
        distinct: ['problemId']
    });
    const completedSystemDesignIds = new Set(completedSystemDesignSubmissions.map(s => s.problemId));

    // 4. Map and compute
    return lists.map(list => {
        const codingProblemIds = list.problems.map(p => p.problemId);
        const systemDesignProblemIds = list.systemDesignProblems.map(p => p.problemId);

        const solvedCodingCount = codingProblemIds.filter(id => solvedProblemIds.has(id)).length;
        const completedSystemDesignCount = systemDesignProblemIds.filter(id => completedSystemDesignIds.has(id)).length;

        const totalCount = codingProblemIds.length + systemDesignProblemIds.length;
        const solvedCount = solvedCodingCount + completedSystemDesignCount;

        return {
            ...list,
            // Keep structure compatible with frontend expectations but limit preview
            problems: list.problems.slice(0, 5), // Only showing coding problems in preview for now to keep it simple
            _count: { problems: totalCount },
            solvedCount,
            problemIds: [...codingProblemIds, ...systemDesignProblemIds],
            codingProblemCount: codingProblemIds.length,
            systemDesignProblemCount: systemDesignProblemIds.length
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

    // Enforce max limit
    const maxLimit = 100;
    const effectiveLimit = Math.min(limit, maxLimit);

    // First check if list exists and get metadata
    const listMetadata = await this.prisma.list.findUnique({
      where: { id },
    });

    if (!listMetadata) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }

    // --- CODING PROBLEMS ---
    const problemWhere: Prisma.ProblemWhereInput = {};
    // ... (existing filters for coding problems)
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
    // Status filter logic for coding problems...
    if (status) {
        const statuses = status.split(',');
        const statusConditions: Prisma.ProblemWhereInput[] = [];
        if (statuses.includes('Solved')) {
          statusConditions.push({ submissions: { some: { userId: user.id, status: 'ACCEPTED' } } });
        }
        if (statuses.includes('Attempted')) {
          statusConditions.push({ submissions: { some: { userId: user.id, status: { not: 'ACCEPTED' } }, none: { userId: user.id, status: 'ACCEPTED' } } });
        }
        if (statuses.includes('Todo')) {
          statusConditions.push({ submissions: { none: { userId: user.id } } });
        }
        if (statusConditions.length > 0) {
          problemWhere.AND = [{ OR: statusConditions }];
        }
    }

    const codingProblemsOnList = await this.prisma.problemsOnLists.findMany({
      where: { listId: id, problem: problemWhere },
      include: { problem: true },
      orderBy: { addedAt: 'desc' },
    });

    // --- SYSTEM DESIGN PROBLEMS ---
    const systemDesignWhere: Prisma.SystemDesignProblemWhereInput = {};
    if (search) {
        systemDesignWhere.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (difficulty) {
        systemDesignWhere.difficulty = { in: difficulty.split(',') as Difficulty[] };
    }
    if (tags) {
        systemDesignWhere.tags = { hasSome: tags.split(',') };
    }
    // Status filter logic for system design problems...
    if (status) {
        const statuses = status.split(',');
        const statusConditions: Prisma.SystemDesignProblemWhereInput[] = [];
        if (statuses.includes('Solved')) { // 'Solved' maps to 'completed'
            statusConditions.push({ submissions: { some: { userId: user.id, status: 'completed' } } });
        }
        if (statuses.includes('Attempted')) { // 'Attempted' maps to 'in_progress'
             statusConditions.push({ submissions: { some: { userId: user.id, status: 'in_progress' } } });
        }
        if (statuses.includes('Todo')) {
             statusConditions.push({ submissions: { none: { userId: user.id } } });
        }
        if (statusConditions.length > 0) {
            systemDesignWhere.AND = [{ OR: statusConditions }];
        }
    }

    const systemDesignProblemsOnList = await this.prisma.systemDesignProblemsOnLists.findMany({
        where: { listId: id, problem: systemDesignWhere },
        include: { problem: true },
        orderBy: { addedAt: 'desc' },
    });

    // --- FETCH SUBMISSIONS FOR STATUS ---
    const codingProblemIds = codingProblemsOnList.map(p => p.problemId);
    const codingSubmissions = await this.prisma.submission.findMany({
        where: { userId: user.id, problemId: { in: codingProblemIds } },
        select: { problemId: true, status: true },
    });

    const systemDesignProblemIds = systemDesignProblemsOnList.map(p => p.problemId);
    const systemDesignSubmissions = await this.prisma.systemDesignSubmission.findMany({
        where: { userId: user.id, problemId: { in: systemDesignProblemIds } },
        select: { problemId: true, status: true },
    });

    // --- MAP STATUS ---
    const statusMap = new Map<string, string>();

    // Coding Status
    codingSubmissions.forEach(s => {
        const current = statusMap.get(s.problemId);
        if (s.status === 'ACCEPTED') statusMap.set(s.problemId, 'Solved');
        else if (current !== 'Solved') statusMap.set(s.problemId, 'Attempted');
    });

    // System Design Status
    systemDesignSubmissions.forEach(s => {
        // Map 'completed' -> 'Solved', 'in_progress' -> 'Attempted'
        const mappedStatus = s.status === 'completed' ? 'Solved' : 'Attempted';
        const current = statusMap.get(s.problemId);
        if (mappedStatus === 'Solved') statusMap.set(s.problemId, 'Solved');
        else if (current !== 'Solved') statusMap.set(s.problemId, 'Attempted');
    });

    // --- MERGE AND ENRICH ---
    const enrichedCodingProblems = codingProblemsOnList.map(p => ({
        ...p,
        problem: { ...p.problem, status: statusMap.get(p.problemId) || 'Todo', type: 'coding' }
    }));

    const enrichedSystemDesignProblems = systemDesignProblemsOnList.map(p => ({
        ...p,
        problem: { ...p.problem, status: statusMap.get(p.problemId) || 'Todo', type: 'system-design' }
    }));

    const allProblems = [...enrichedCodingProblems, ...enrichedSystemDesignProblems];

    // --- SORT (In-Memory) ---
    if (sort) {
        const sortOrder = order === 'desc' ? -1 : 1;
        allProblems.sort((a, b) => {
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
    } else {
        // Default sort by addedAt desc
        allProblems.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    }

    // --- PAGINATE ---
    const total = allProblems.length;
    const skip = (page - 1) * effectiveLimit;
    const paginatedProblems = allProblems.slice(skip, skip + effectiveLimit);

    return {
        ...listMetadata,
        problems: paginatedProblems,
        total,
        page,
        limit: effectiveLimit,
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
    if (!dto.problemIds || dto.problemIds.length === 0) {
        return { count: 0 };
    }

    // Lightweight ownership check
    const list = await this.prisma.list.findFirst({
        where: { id, userId: user.id },
        select: { id: true }
    });

    if (!list) {
        throw new NotFoundException(`List with ID ${id} not found`);
    }

    // Ensure unique IDs
    const uniqueProblemIds = [...new Set(dto.problemIds)];

    // 1. Identify Coding Problems
    const codingProblems = await this.prisma.problem.findMany({
        where: { id: { in: uniqueProblemIds } },
        select: { id: true }
    });
    const codingProblemIds = codingProblems.map(p => p.id);

    // 2. Identify System Design Problems (remaining IDs)
    const remainingIds = uniqueProblemIds.filter(id => !codingProblemIds.includes(id));
    const systemDesignProblems = await this.prisma.systemDesignProblem.findMany({
        where: { id: { in: remainingIds } },
        select: { id: true }
    });
    const systemDesignProblemIds = systemDesignProblems.map(p => p.id);

    if (codingProblemIds.length === 0 && systemDesignProblemIds.length === 0) {
        return { count: 0, message: 'No valid problems found to add.' };
    }

    try {
        const results = await this.prisma.$transaction([
            // Add Coding Problems
            ...(codingProblemIds.length > 0 ? [
                this.prisma.problemsOnLists.createMany({
                    data: codingProblemIds.map(pid => ({ listId: id, problemId: pid })),
                    skipDuplicates: true
                })
            ] : []),
            // Add System Design Problems
            ...(systemDesignProblemIds.length > 0 ? [
                this.prisma.systemDesignProblemsOnLists.createMany({
                    data: systemDesignProblemIds.map(pid => ({ listId: id, problemId: pid })),
                    skipDuplicates: true
                })
            ] : [])
        ]);

        return { success: true, addedCoding: codingProblemIds.length, addedSystemDesign: systemDesignProblemIds.length };

    } catch (error) {
      console.error('Failed to add problems to list:', error);
      throw error;
    }
  }

  async removeProblems(id: string, dto: ManageListProblemsDto, user: any) {
    if (!dto.problemIds || dto.problemIds.length === 0) {
        return { count: 0 };
    }

    // Lightweight ownership check
    const list = await this.prisma.list.findFirst({
        where: { id, userId: user.id },
        select: { id: true }
    });

    if (!list) {
        throw new NotFoundException(`List with ID ${id} not found`);
    }

    try {
        await this.prisma.$transaction([
            this.prisma.problemsOnLists.deleteMany({
                where: {
                    listId: id,
                    problemId: { in: dto.problemIds }
                }
            }),
            this.prisma.systemDesignProblemsOnLists.deleteMany({
                where: {
                    listId: id,
                    problemId: { in: dto.problemIds }
                }
            })
        ]);
        return { success: true };
    } catch (error) {
        console.error('Failed to remove problems from list:', error);
        throw error;
    }
  }
}
