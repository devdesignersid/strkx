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
exports.ListsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ListsService = class ListsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDemoUser() {
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo@example.com' },
        });
        if (!user) {
            return this.prisma.user.create({
                data: {
                    email: 'demo@example.com',
                    name: 'Demo User'
                }
            });
        }
        return user;
    }
    async create(createListDto) {
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
        const solvedSubmissions = await this.prisma.submission.findMany({
            where: {
                userId: user.id,
                status: 'ACCEPTED'
            },
            select: { problemId: true },
            distinct: ['problemId']
        });
        const solvedProblemIds = new Set(solvedSubmissions.map(s => s.problemId));
        return lists.map(list => {
            const problemIds = list.problems.map(p => p.problemId);
            const solvedCount = problemIds.filter(id => solvedProblemIds.has(id)).length;
            const totalCount = problemIds.length;
            return {
                ...list,
                problems: list.problems.slice(0, 5),
                _count: { problems: totalCount },
                solvedCount
            };
        });
    }
    async findOne(id) {
        const user = await this.getDemoUser();
        const list = await this.prisma.list.findUnique({
            where: { id },
            include: {
                problems: {
                    include: {
                        problem: true,
                    },
                },
            },
        });
        if (!list) {
            throw new common_1.NotFoundException(`List with ID ${id} not found`);
        }
        const problemIds = list.problems.map(p => p.problemId);
        const submissions = await this.prisma.submission.findMany({
            where: {
                userId: user.id,
                problemId: { in: problemIds }
            },
            select: {
                problemId: true,
                status: true
            }
        });
        const statusMap = new Map();
        submissions.forEach(s => {
            const current = statusMap.get(s.problemId);
            if (s.status === 'ACCEPTED') {
                statusMap.set(s.problemId, 'Solved');
            }
            else if (current !== 'Solved') {
                statusMap.set(s.problemId, 'Attempted');
            }
        });
        const enrichedProblems = list.problems.map(p => ({
            ...p,
            problem: {
                ...p.problem,
                status: statusMap.get(p.problemId) || 'Todo'
            }
        }));
        return {
            ...list,
            problems: enrichedProblems
        };
    }
    async update(id, updateListDto) {
        return this.prisma.list.update({
            where: { id },
            data: updateListDto,
        });
    }
    async remove(id) {
        return this.prisma.list.delete({
            where: { id },
        });
    }
    async addProblems(id, dto) {
        const list = await this.findOne(id);
        const data = dto.problemIds.map(problemId => ({
            listId: id,
            problemId: problemId
        }));
        return this.prisma.problemsOnLists.createMany({
            data,
            skipDuplicates: true
        });
    }
    async removeProblems(id, dto) {
        return this.prisma.problemsOnLists.deleteMany({
            where: {
                listId: id,
                problemId: {
                    in: dto.problemIds
                }
            }
        });
    }
};
exports.ListsService = ListsService;
exports.ListsService = ListsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ListsService);
//# sourceMappingURL=lists.service.js.map