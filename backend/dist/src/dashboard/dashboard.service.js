"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user)
            return { solved: 0, attempted: 0, accuracy: 0, streak: 0, easy: 0, medium: 0, hard: 0, weeklyChange: 0 };
        const distinctSolved = await this.prisma.submission.findMany({
            where: { userId: user.id, status: 'ACCEPTED' },
            distinct: ['problemId'],
            select: { problem: { select: { difficulty: true } }, createdAt: true },
        });
        let solvedEasy = 0;
        let solvedMedium = 0;
        let solvedHard = 0;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        let solvedThisWeek = 0;
        let solvedLastWeek = 0;
        for (const s of distinctSolved) {
            if (s.problem.difficulty === 'Easy')
                solvedEasy++;
            else if (s.problem.difficulty === 'Medium')
                solvedMedium++;
            else if (s.problem.difficulty === 'Hard')
                solvedHard++;
            const date = new Date(s.createdAt);
            if (date >= oneWeekAgo)
                solvedThisWeek++;
            else if (date >= twoWeeksAgo)
                solvedLastWeek++;
        }
        const solvedTotal = distinctSolved.length;
        const attemptedGroup = await this.prisma.submission.groupBy({
            by: ['problemId'],
            where: { userId: user.id },
        });
        const attempted = attemptedGroup.length;
        const aggregations = await this.prisma.submission.aggregate({
            where: { userId: user.id },
            _count: {
                id: true,
            },
        });
        const totalSubmissions = aggregations._count.id;
        const acceptedCount = await this.prisma.submission.count({
            where: { userId: user.id, status: 'ACCEPTED' },
        });
        const accuracy = totalSubmissions > 0
            ? Math.round((acceptedCount / totalSubmissions) * 100)
            : 0;
        let weeklyChange = 0;
        if (solvedLastWeek > 0) {
            weeklyChange = Math.round(((solvedThisWeek - solvedLastWeek) / solvedLastWeek) * 100);
        }
        else if (solvedThisWeek > 0) {
            weeklyChange = 100;
        }
        return {
            solved: solvedTotal,
            attempted,
            accuracy,
            streak: 1,
            easy: solvedEasy,
            medium: solvedMedium,
            hard: solvedHard,
            weeklyChange,
        };
    }
    async getActivity() {
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user)
            return [];
        const submissions = await this.prisma.submission.findMany({
            where: { userId: user.id },
            distinct: ['problemId'],
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { problem: { select: { title: true, slug: true, difficulty: true } } },
        });
        return submissions.map((s) => ({
            id: s.id,
            problemTitle: s.problem.title,
            problemSlug: s.problem.slug,
            difficulty: s.problem.difficulty,
            status: s.status,
            timestamp: s.createdAt,
        }));
    }
    async getHeatmap() {
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user)
            return [];
        const submissions = await this.prisma.submission.findMany({
            where: {
                userId: user.id,
                status: 'ACCEPTED'
            },
            select: {
                createdAt: true,
                problemId: true
            },
        });
        const activityMap = new Map();
        submissions.forEach((s) => {
            const date = s.createdAt.toISOString().split('T')[0];
            if (!activityMap.has(date)) {
                activityMap.set(date, new Set());
            }
            activityMap.get(date).add(s.problemId);
        });
        return Array.from(activityMap.entries()).map(([date, problems]) => ({
            date,
            count: problems.size,
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map