import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        solved: number;
        attempted: number;
        accuracy: number;
        streak: number;
        easy: number;
        medium: number;
        hard: number;
        weeklyChange: number;
    }>;
    getActivity(): Promise<{
        id: string;
        problemTitle: string;
        problemSlug: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: string;
        timestamp: Date;
    }[]>;
    getHeatmap(): Promise<{
        date: string;
        count: number;
    }[]>;
}
