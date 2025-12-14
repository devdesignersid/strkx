import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    ExportOptionsDto,
    ExportData,
    ExportedCodingProblem,
    ExportedSystemDesignProblem,
    ExportedList,
} from '../dto/export.dto';
import { CURRENT_EXPORT_VERSION } from '../validators/schemas';

/**
 * ExportService
 * 
 * Handles exporting user data to a structured JSON format.
 * Supports configurable options for including/excluding various data types.
 */
@Injectable()
export class ExportService {
    constructor(private prisma: PrismaService) { }

    /**
     * Export user data based on the provided options
     */
    async exportData(userId: string, options: ExportOptionsDto): Promise<ExportData> {
        const result: ExportData = {
            version: CURRENT_EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            codingProblems: [],
            systemDesignProblems: [],
            lists: [],
        };

        // Export Coding Problems
        if (options.includeCodingProblems !== false) {
            result.codingProblems = await this.exportCodingProblems(userId, options);
        }

        // Export System Design Problems
        if (options.includeSystemDesignProblems !== false) {
            result.systemDesignProblems = await this.exportSystemDesignProblems(userId, options);
        }

        // Export Lists
        if (options.includeLists !== false) {
            result.lists = await this.exportLists(userId, options);
        }

        return result;
    }

    /**
     * Export coding problems with optional test cases, submissions, and solutions
     */
    private async exportCodingProblems(
        userId: string,
        options: ExportOptionsDto
    ): Promise<ExportedCodingProblem[]> {
        const whereClause: any = { userId };

        // If specific IDs provided, filter by them
        if (options.problemIds && options.problemIds.length > 0) {
            whereClause.id = { in: options.problemIds };
        }

        const problems = await this.prisma.problem.findMany({
            where: whereClause,
            include: {
                testCases: options.includeTestCases !== false,
                submissions: options.includeSubmissions === true || options.includeSolutions !== false
                    ? {
                        where: { userId },
                        orderBy: { createdAt: 'desc' },
                    }
                    : false,
            },
            orderBy: { createdAt: 'asc' },
        });

        return problems.map(problem => {
            const exported: ExportedCodingProblem = {
                slug: problem.slug,
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                type: problem.type,
                starterCode: problem.starterCode || undefined,
                className: problem.className || undefined,
                tags: problem.tags,
                inputTypes: problem.inputTypes,
                returnType: problem.returnType || undefined,
                comparisonType: problem.comparisonType || undefined,
                timeoutMs: problem.timeoutMs,
                memoryLimitMb: problem.memoryLimitMb,
                timeLimit: problem.timeLimit,
            };

            // Include test cases if requested
            if (options.includeTestCases !== false && problem.testCases) {
                exported.testCases = problem.testCases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: tc.isHidden,
                }));
            }

            // Filter submissions for solutions vs all submissions
            if (problem.submissions) {
                // Include solutions (submissions marked as solutions)
                if (options.includeSolutions !== false) {
                    const solutionSubmissions = problem.submissions.filter(s => s.isSolution);
                    if (solutionSubmissions.length > 0) {
                        exported.solutions = solutionSubmissions.map(s => ({
                            name: s.solutionName || 'Solution',
                            code: s.code,
                            language: s.language,
                            executionTime: s.executionTime || undefined,
                            memoryUsed: s.memoryUsed || undefined,
                        }));
                    }
                }

                // Include all submissions if requested
                if (options.includeSubmissions === true) {
                    exported.submissions = problem.submissions.map(s => ({
                        code: s.code,
                        language: s.language,
                        status: s.status,
                        output: s.output,
                        executionTime: s.executionTime || undefined,
                        memoryUsed: s.memoryUsed || undefined,
                        isSolution: s.isSolution || undefined,
                        solutionName: s.solutionName || undefined,
                        createdAt: s.createdAt.toISOString(),
                    }));
                }
            }

            return exported;
        });
    }

    /**
     * Export system design problems with optional submissions and solutions
     */
    private async exportSystemDesignProblems(
        userId: string,
        options: ExportOptionsDto
    ): Promise<ExportedSystemDesignProblem[]> {
        const whereClause: any = { userId };

        if (options.systemDesignProblemIds && options.systemDesignProblemIds.length > 0) {
            whereClause.id = { in: options.systemDesignProblemIds };
        }

        const problems = await this.prisma.systemDesignProblem.findMany({
            where: whereClause,
            include: {
                solutions: options.includeSolutions !== false,
                submissions: options.includeSubmissions === true
                    ? {
                        where: { userId },
                        orderBy: { createdAt: 'desc' },
                    }
                    : false,
            },
            orderBy: { createdAt: 'asc' },
        });

        return problems.map(problem => {
            const exported: ExportedSystemDesignProblem = {
                slug: problem.slug,
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                defaultDuration: problem.defaultDuration,
                tags: problem.tags,
                constraints: problem.constraints,
            };

            // Include solutions
            if (options.includeSolutions !== false && problem.solutions) {
                exported.solutions = problem.solutions.map(s => ({
                    title: s.title,
                    description: s.description,
                    diagramSnapshot: s.diagramSnapshot || undefined,
                    excalidrawJson: s.excalidrawJson || undefined,
                    author: s.author || undefined,
                }));
            }

            // Include submissions
            if (options.includeSubmissions === true && problem.submissions) {
                exported.submissions = problem.submissions.map(s => ({
                    excalidrawJson: s.excalidrawJson,
                    notesMarkdown: s.notesMarkdown || undefined,
                    timeSpentSeconds: s.timeSpentSeconds,
                    status: s.status,
                    isSolution: s.isSolution || undefined,
                    solutionName: s.solutionName || undefined,
                    score: s.score || undefined,
                    createdAt: s.createdAt.toISOString(),
                }));
            }

            return exported;
        });
    }

    /**
     * Export lists with problem slug references
     */
    private async exportLists(
        userId: string,
        options: ExportOptionsDto
    ): Promise<ExportedList[]> {
        const whereClause: any = { userId };

        if (options.listIds && options.listIds.length > 0) {
            whereClause.id = { in: options.listIds };
        }

        const lists = await this.prisma.list.findMany({
            where: whereClause,
            include: {
                problems: {
                    include: {
                        problem: {
                            select: { slug: true },
                        },
                    },
                },
                systemDesignProblems: {
                    include: {
                        problem: {
                            select: { slug: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return lists.map(list => ({
            name: list.name,
            description: list.description || undefined,
            problemSlugs: list.problems.map(p => p.problem.slug),
            systemDesignProblemSlugs: list.systemDesignProblems.map(p => p.problem.slug),
        }));
    }

    /**
     * Format export data as beautifully formatted JSON string
     */
    formatAsJson(data: ExportData): string {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Generate a filename for the export
     */
    generateFilename(): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `strkx-export-${timestamp}.json`;
    }
}
