import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ManageListProblemsDto } from './dto/manage-list-problems.dto';
export declare class ListsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getDemoUser;
    create(createListDto: CreateListDto): Promise<{
        _count: {
            problems: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string;
    }>;
    findAll(): Promise<{
        problems: {
            problem: {
                tags: string[];
            };
            problemId: string;
        }[];
        _count: {
            problems: number;
        };
        solvedCount: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string;
    }[]>;
    findOne(id: string): Promise<{
        problems: {
            problem: {
                status: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                title: string;
                description: string;
                starterCode: string | null;
                difficulty: import(".prisma/client").$Enums.Difficulty;
                timeLimit: number;
                tags: string[];
            };
            problemId: string;
            listId: string;
            addedAt: Date;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string;
    }>;
    update(id: string, updateListDto: UpdateListDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        userId: string;
    }>;
    addProblems(id: string, dto: ManageListProblemsDto): Promise<import(".prisma/client").Prisma.BatchPayload>;
    removeProblems(id: string, dto: ManageListProblemsDto): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
