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
            return { solved: 0, attempted: 0, accuracy: 0, streak: 0 };
        const submissions = await this.prisma.submission.findMany({
            where: { userId: user.id },
            select: { status: true, problemId: true, problem: { select: { difficulty: true } }, createdAt: true },
        });
        const solvedProblems = new Set();
        const solvedEasy = new Set();
        const solvedMedium = new Set();
        const solvedHard = new Set();
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const solvedThisWeek = new Set();
        const solvedLastWeek = new Set();
        submissions.forEach((s) => {
            if (s.status === 'ACCEPTED') {
                solvedProblems.add(s.problemId);
                if (s.problem.difficulty === 'Easy')
                    solvedEasy.add(s.problemId);
                if (s.problem.difficulty === 'Medium')
                    solvedMedium.add(s.problemId);
                if (s.problem.difficulty === 'Hard')
                    solvedHard.add(s.problemId);
                const submissionDate = new Date(s.createdAt);
                if (submissionDate >= oneWeekAgo) {
                    solvedThisWeek.add(s.problemId);
                }
                else if (submissionDate >= twoWeeksAgo) {
                    solvedLastWeek.add(s.problemId);
                }
            }
        });
        const currentCount = solvedThisWeek.size;
        const previousCount = solvedLastWeek.size;
        let weeklyChange = 0;
        if (previousCount > 0) {
            weeklyChange = Math.round(((currentCount - previousCount) / previousCount) * 100);
        }
        else if (currentCount > 0) {
            weeklyChange = 100;
        }
        const attemptedProblems = new Set(submissions.map((s) => s.problemId));
        const totalSubmissions = submissions.length;
        const acceptedSubmissions = submissions.filter((s) => s.status === 'ACCEPTED').length;
        const accuracy = totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0;
        return {
            solved: solvedProblems.size,
            attempted: attemptedProblems.size,
            accuracy,
            streak: 1,
            easy: solvedEasy.size,
            medium: solvedMedium.size,
            hard: solvedHard.size,
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