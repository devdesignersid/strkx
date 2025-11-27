import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProblemsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProblemDto: CreateProblemDto): Promise<{
        testCases: {
            id: string;
            problemId: string;
            input: string;
            expectedOutput: string;
            isHidden: boolean;
        }[];
    } & {
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
    }>;
    findAll(): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        slug: string;
        title: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        tags: string[];
    }[]>;
    findOne(slug: string): Promise<{
        testCases: {
            id: string;
            problemId: string;
            input: string;
            expectedOutput: string;
            isHidden: boolean;
        }[];
    } & {
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
    }>;
    findById(id: string): Promise<{
        testCases: {
            id: string;
            problemId: string;
            input: string;
            expectedOutput: string;
            isHidden: boolean;
        }[];
    } & {
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
    }>;
    update(id: string, updateProblemDto: UpdateProblemDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    findSubmissions(slug: string): Promise<{
        timePercentile: number | null;
        memoryPercentile: number | null;
        id: string;
        createdAt: Date;
        code: string;
        status: string;
        output: string;
        executionTime: number | null;
        memoryUsed: number | null;
        isSolution: boolean;
        solutionName: string | null;
    }[]>;
    updateSubmissionSolution(slug: string, submissionId: string, isSolution: boolean, solutionName?: string): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        language: string;
        status: string;
        output: string;
        executionTime: number | null;
        memoryUsed: number | null;
        isSolution: boolean;
        solutionName: string | null;
        problemId: string;
        userId: string;
    }>;
    findSolutions(slug: string): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        executionTime: number | null;
        memoryUsed: number | null;
        solutionName: string | null;
    }[]>;
}
