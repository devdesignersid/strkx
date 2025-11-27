import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
        solved: number;
        attempted: number;
        accuracy: number;
        streak: number;
        easy?: undefined;
        medium?: undefined;
        hard?: undefined;
        weeklyChange?: undefined;
    } | {
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
