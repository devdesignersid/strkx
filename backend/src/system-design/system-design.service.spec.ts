import { Test, TestingModule } from '@nestjs/testing';
import { SystemDesignService } from './system-design.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { NotFoundException } from '@nestjs/common';

describe('SystemDesignService', () => {
    let service: SystemDesignService;
    let prisma: PrismaService;
    let dashboardService: DashboardService;

    const mockPrismaService = {
        systemDesignProblem: {
            findUnique: jest.fn(),
            delete: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        systemDesignSubmission: {
            deleteMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        systemDesignSolution: {
            deleteMany: jest.fn(),
        },
        systemDesignProblemsOnLists: {
            deleteMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn((arg) => {
            if (Array.isArray(arg)) {
                return Promise.all(arg);
            }
            return arg(mockPrismaService);
        }),
    };

    const mockDashboardService = {
        invalidateUserCache: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SystemDesignService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: DashboardService, useValue: mockDashboardService },
            ],
        }).compile();

        service = module.get<SystemDesignService>(SystemDesignService);
        prisma = module.get<PrismaService>(PrismaService);
        dashboardService = module.get<DashboardService>(DashboardService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('deleteProblem', () => {
        it('should delete submissions, solutions, list entries, and problem', async () => {
            const problemId = 'problem-1';
            const userId = 'user-1';
            const mockProblem = { id: problemId, userId };

            mockPrismaService.systemDesignProblem.findUnique.mockResolvedValue(mockProblem);
            mockPrismaService.systemDesignProblem.delete.mockResolvedValue(mockProblem);

            await service.deleteProblem(problemId);

            expect(prisma.systemDesignProblem.findUnique).toHaveBeenCalledWith({ where: { id: problemId } });

            // Verify transaction calls
            expect(prisma.systemDesignSubmission.deleteMany).toHaveBeenCalledWith({ where: { problemId } });
            expect(prisma.systemDesignSolution.deleteMany).toHaveBeenCalledWith({ where: { problemId } });
            expect(prisma.systemDesignProblemsOnLists.deleteMany).toHaveBeenCalledWith({ where: { problemId } });
            expect(prisma.systemDesignProblem.delete).toHaveBeenCalledWith({ where: { id: problemId } });

            // Verify cache invalidation
            expect(dashboardService.invalidateUserCache).toHaveBeenCalledWith(userId);
        });

        it('should throw NotFoundException if problem does not exist', async () => {
            mockPrismaService.systemDesignProblem.findUnique.mockResolvedValue(null);

            await expect(service.deleteProblem('non-existent')).rejects.toThrow(NotFoundException);

            expect(prisma.$transaction).not.toHaveBeenCalled();
            expect(dashboardService.invalidateUserCache).not.toHaveBeenCalled();
        });
    });
});
