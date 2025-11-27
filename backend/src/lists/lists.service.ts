import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

  async create(createListDto: CreateListDto) {
    const user = await this.getDemoUser();
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

  async findAll() {
    const user = await this.getDemoUser();

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

  async findOne(id: string, page: number = 1, limit: number = 20) {
    const user = await this.getDemoUser();
    const skip = (page - 1) * limit;

    // First check if list exists and get metadata
    const listMetadata = await this.prisma.list.findUnique({
      where: { id },
    });

    if (!listMetadata) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }

    // Get total count of problems in this list
    const total = await this.prisma.problemsOnLists.count({
      where: { listId: id },
    });

    // Fetch paginated problems
    const problemsOnList = await this.prisma.problemsOnLists.findMany({
      where: { listId: id },
      include: {
        problem: true,
      },
      skip,
      take: limit,
      orderBy: { addedAt: 'desc' }, // Order by when they were added
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

    return {
      ...listMetadata,
      problems: enrichedProblems,
      total,
      page,
      limit,
      hasMore: skip + problemsOnList.length < total,
    };
  }

  async update(id: string, updateListDto: UpdateListDto) {
    return this.prisma.list.update({
      where: { id },
      data: updateListDto,
    });
  }

  async remove(id: string) {
    return this.prisma.list.delete({
      where: { id },
    });
  }

  async addProblems(id: string, dto: ManageListProblemsDto) {
    const list = await this.findOne(id); // Ensure list exists

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

  async removeProblems(id: string, dto: ManageListProblemsDto) {
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
