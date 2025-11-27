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
exports.ProblemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProblemsService = class ProblemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProblemDto) {
        const { testCases, ...problemData } = createProblemDto;
        return this.prisma.problem.create({
            data: {
                ...problemData,
                testCases: {
                    create: testCases,
                },
            },
            include: {
                testCases: true,
            },
        });
    }
    async findAll() {
        const problems = await this.prisma.problem.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                tags: true,
                createdAt: true,
            },
        });
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user) {
            return problems.map((p) => ({ ...p, status: 'Todo' }));
        }
        const submissions = await this.prisma.submission.findMany({
            where: { userId: user.id },
            select: { problemId: true, status: true },
        });
        const statusMap = new Map();
        submissions.forEach((s) => {
            if (s.status === 'ACCEPTED') {
                statusMap.set(s.problemId, 'Solved');
            }
            else if (!statusMap.has(s.problemId)) {
                statusMap.set(s.problemId, 'Attempted');
            }
        });
        return problems.map((p) => ({
            ...p,
            status: statusMap.get(p.id) || 'Todo',
        }));
    }
    async findOne(slug) {
        const problem = await this.prisma.problem.findUnique({
            where: { slug },
            include: {
                testCases: {
                    where: { isHidden: false },
                },
            },
        });
        if (!problem) {
            throw new common_1.NotFoundException(`Problem with slug ${slug} not found`);
        }
        return problem;
    }
    async findById(id) {
        const problem = await this.prisma.problem.findUnique({
            where: { id },
            include: {
                testCases: true,
            },
        });
        if (!problem) {
            throw new common_1.NotFoundException(`Problem with id ${id} not found`);
        }
        return problem;
    }
    async update(id, updateProblemDto) {
        const { testCases, ...problemData } = updateProblemDto;
        if (testCases) {
            await this.prisma.testCase.deleteMany({
                where: { problemId: id },
            });
        }
        return this.prisma.problem.update({
            where: { id },
            data: {
                ...problemData,
                ...(testCases && {
                    testCases: {
                        create: testCases,
                    },
                }),
            },
        });
    }
    async remove(id) {
        await this.prisma.submission.deleteMany({
            where: { problemId: id },
        });
        await this.prisma.testCase.deleteMany({
            where: { problemId: id },
        });
        return this.prisma.problem.delete({
            where: { id },
        });
    }
    async findSubmissions(slug) {
        const problem = await this.prisma.problem.findUnique({
            where: { slug },
        });
        if (!problem) {
            throw new common_1.NotFoundException(`Problem with slug ${slug} not found`);
        }
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user)
            return [];
        const submissions = await this.prisma.submission.findMany({
            where: {
                problemId: problem.id,
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                code: true,
                status: true,
                createdAt: true,
                output: true,
                executionTime: true,
                memoryUsed: true,
                isSolution: true,
                solutionName: true,
            },
        });
        const executionTimes = submissions
            .map(s => s.executionTime)
            .filter(t => t != null)
            .sort((a, b) => a - b);
        const memoryUsages = submissions
            .map(s => s.memoryUsed)
            .filter(m => m != null)
            .sort((a, b) => a - b);
        return submissions.map(submission => {
            let timePercentile = null;
            let memoryPercentile = null;
            if (submission.executionTime != null && executionTimes.length > 0) {
                const rank = executionTimes.filter(t => t <= submission.executionTime).length;
                timePercentile = Math.round((rank / executionTimes.length) * 100);
            }
            if (submission.memoryUsed != null && memoryUsages.length > 0) {
                const rank = memoryUsages.filter(m => m <= submission.memoryUsed).length;
                memoryPercentile = Math.round((rank / memoryUsages.length) * 100);
            }
            return {
                ...submission,
                timePercentile,
                memoryPercentile,
            };
        });
    }
    async updateSubmissionSolution(slug, submissionId, isSolution, solutionName) {
        const problem = await this.prisma.problem.findUnique({
            where: { slug },
        });
        if (!problem) {
            throw new common_1.NotFoundException(`Problem with slug ${slug} not found`);
        }
        return this.prisma.submission.update({
            where: { id: submissionId },
            data: {
                isSolution,
                solutionName: isSolution ? solutionName : null,
            },
        });
    }
    async findSolutions(slug) {
        const problem = await this.prisma.problem.findUnique({
            where: { slug },
        });
        if (!problem) {
            throw new common_1.NotFoundException(`Problem with slug ${slug} not found`);
        }
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user)
            return [];
        return this.prisma.submission.findMany({
            where: {
                problemId: problem.id,
                userId: user.id,
                isSolution: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                code: true,
                solutionName: true,
                executionTime: true,
                memoryUsed: true,
                createdAt: true,
            },
        });
    }
};
exports.ProblemsService = ProblemsService;
exports.ProblemsService = ProblemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProblemsService);
//# sourceMappingURL=problems.service.js.map