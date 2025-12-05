import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    ImportOptionsDto,
    ImportResultDto,
    ImportPreviewDto,
    DuplicateMode,
    ImportError,
} from '../dto/import.dto';
import {
    ExportDataSchema,
    ValidatedExportData,
    ValidatedCodingProblem,
    ValidatedSystemDesignProblem,
    ValidatedList,
    SUPPORTED_VERSIONS,
    IMPORT_LIMITS,
} from '../validators/schemas';
import { DuplicateHandler } from '../handlers/duplicate.handler';
import { ErrorAggregator } from '../handlers/error-aggregator';
import { Difficulty, ProblemType } from '@prisma/client';

/**
 * ImportService
 * 
 * Handles importing data from JSON with fault-tolerance.
 * Continues processing even when individual items fail.
 */
@Injectable()
export class ImportService {
    constructor(
        private prisma: PrismaService,
        private duplicateHandler: DuplicateHandler,
        private errorAggregator: ErrorAggregator,
    ) { }

    /**
     * Preview import data without actually importing
     */
    async previewImport(data: unknown): Promise<ImportPreviewDto> {
        const result: ImportPreviewDto = {
            isValid: true,
            version: '',
            counts: {
                codingProblems: 0,
                systemDesignProblems: 0,
                lists: 0,
                totalTestCases: 0,
            },
            errors: [],
            warnings: [],
        };

        // Safe parse
        const parsed = this.safeParse(data, result.errors);
        if (!parsed) {
            result.isValid = false;
            return result;
        }

        // Schema validation
        const validated = this.validateSchema(parsed, result.errors);
        if (!validated) {
            result.isValid = false;
            return result;
        }

        // Version check
        result.version = validated.version;
        if (!this.checkVersion(validated.version, result.warnings)) {
            result.warnings.push(`Version ${validated.version} may have compatibility issues`);
        }

        // Counts
        result.counts.codingProblems = validated.codingProblems?.length || 0;
        result.counts.systemDesignProblems = validated.systemDesignProblems?.length || 0;
        result.counts.lists = validated.lists?.length || 0;
        result.counts.totalTestCases = validated.codingProblems?.reduce(
            (sum, p) => sum + (p.testCases?.length || 0),
            0
        ) || 0;

        return result;
    }

    /**
     * Import data with fault-tolerance
     */
    async importData(
        userId: string,
        data: unknown,
        options: ImportOptionsDto
    ): Promise<ImportResultDto> {
        const result: ImportResultDto = {
            success: true,
            importedCount: {
                codingProblems: 0,
                systemDesignProblems: 0,
                lists: 0,
                testCases: 0,
                submissions: 0,
            },
            skippedCount: 0,
            overwrittenCount: 0,
            errors: [],
            duplicates: [],
            warnings: [],
        };

        // 1. Safe JSON parse (if string)
        const parsed = this.safeParse(data, result.errors);
        if (!parsed) {
            result.success = false;
            return result;
        }

        // 2. Schema validation
        const validated = this.validateSchema(parsed, result.errors);
        if (!validated) {
            result.success = false;
            return result;
        }

        // 3. Version compatibility check
        if (!this.checkVersion(validated.version, result.warnings)) {
            result.warnings.push(`Import version ${validated.version} may have compatibility issues`);
        }

        // 4. Detect duplicates
        const duplicates = await this.duplicateHandler.detectAll(userId, validated);

        // 5. Handle duplicates based on mode
        if (options.duplicateMode === DuplicateMode.ASK && duplicates.length > 0) {
            result.duplicates = duplicates;
            return result; // Return early to ask user
        }

        // 6. Import with fault-tolerance
        await this.performImport(userId, validated, options, duplicates, result);

        result.success = result.errors.length === 0;
        return result;
    }

    /**
     * Safe parse JSON data
     */
    private safeParse(data: unknown, errors: ImportError[]): unknown | null {
        if (typeof data === 'string') {
            try {
                // Check size limit
                if (data.length > IMPORT_LIMITS.MAX_FILE_SIZE_BYTES) {
                    errors.push({
                        itemIndex: -1,
                        itemType: 'codingProblem',
                        field: 'file',
                        expected: `max ${IMPORT_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
                        actual: `${(data.length / (1024 * 1024)).toFixed(2)}MB`,
                        message: 'Import file exceeds maximum size limit',
                        path: [],
                    });
                    return null;
                }
                return JSON.parse(data);
            } catch (e) {
                errors.push({
                    itemIndex: -1,
                    itemType: 'codingProblem',
                    field: 'json',
                    expected: 'valid JSON',
                    actual: 'invalid JSON syntax',
                    message: `Failed to parse JSON: ${(e as Error).message}`,
                    path: [],
                });
                return null;
            }
        }
        return data;
    }

    /**
     * Validate data against schema
     */
    private validateSchema(
        data: unknown,
        errors: ImportError[]
    ): ValidatedExportData | null {
        const parseResult = ExportDataSchema.safeParse(data);

        if (!parseResult.success) {
            const zodErrors = this.errorAggregator.fromZodError(
                parseResult.error,
                'codingProblem',
                -1
            );
            errors.push(...zodErrors);
            return null;
        }

        return parseResult.data;
    }

    /**
     * Check version compatibility
     */
    private checkVersion(version: string, warnings: string[]): boolean {
        if (!SUPPORTED_VERSIONS.includes(version)) {
            warnings.push(
                `Export version ${version} is not in supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
            );
            return false;
        }
        return true;
    }

    /**
     * Perform the actual import with fault-tolerance
     */
    private async performImport(
        userId: string,
        validated: ValidatedExportData,
        options: ImportOptionsDto,
        duplicates: ImportResultDto['duplicates'],
        result: ImportResultDto
    ): Promise<void> {
        // Track imported slugs for list reference resolution
        const importedProblemSlugs = new Map<string, string>(); // slug -> id
        const importedSystemDesignSlugs = new Map<string, string>(); // slug -> id

        // Helper for batched execution
        const processBatched = async <T>(
            items: T[],
            batchSize: number,
            processor: (item: T, index: number) => Promise<any>
        ) => {
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await Promise.all(batch.map((item, batchIndex) => processor(item, i + batchIndex)));
            }
        };

        const BATCH_SIZE = 10;

        // Import coding problems
        const codingProblems = validated.codingProblems || [];
        await processBatched(codingProblems, BATCH_SIZE, async (problem, i) => {
            try {
                const imported = await this.importCodingProblem(
                    userId,
                    problem,
                    i,
                    options,
                    duplicates,
                    result
                );
                if (imported) {
                    importedProblemSlugs.set(problem.slug, imported.id);
                }
            } catch (error) {
                result.errors.push(
                    this.errorAggregator.createDatabaseError(
                        'codingProblem',
                        i,
                        'create',
                        (error as Error).message
                    )
                );
            }
        });

        // Import system design problems
        const systemDesignProblems = validated.systemDesignProblems || [];
        await processBatched(systemDesignProblems, BATCH_SIZE, async (problem, i) => {
            try {
                const imported = await this.importSystemDesignProblem(
                    userId,
                    problem,
                    i,
                    options,
                    duplicates,
                    result
                );
                if (imported) {
                    importedSystemDesignSlugs.set(problem.slug, imported.id);
                }
            } catch (error) {
                result.errors.push(
                    this.errorAggregator.createDatabaseError(
                        'systemDesignProblem',
                        i,
                        'create',
                        (error as Error).message
                    )
                );
            }
        });

        // Get all existing problem slugs for list reference resolution
        const existingProblems = await this.prisma.problem.findMany({
            where: { userId },
            select: { id: true, slug: true },
        });
        for (const p of existingProblems) {
            if (!importedProblemSlugs.has(p.slug)) {
                importedProblemSlugs.set(p.slug, p.id);
            }
        }

        const existingSystemDesign = await this.prisma.systemDesignProblem.findMany({
            where: { userId },
            select: { id: true, slug: true },
        });
        for (const p of existingSystemDesign) {
            if (!importedSystemDesignSlugs.has(p.slug)) {
                importedSystemDesignSlugs.set(p.slug, p.id);
            }
        }

        // Import lists
        const lists = validated.lists || [];
        await processBatched(lists, BATCH_SIZE, async (list, i) => {
            try {
                await this.importList(
                    userId,
                    list,
                    i,
                    options,
                    duplicates,
                    importedProblemSlugs,
                    importedSystemDesignSlugs,
                    result
                );
            } catch (error) {
                result.errors.push(
                    this.errorAggregator.createDatabaseError(
                        'list',
                        i,
                        'create',
                        (error as Error).message
                    )
                );
            }
        });
    }

    /**
     * Import a single coding problem
     */
    private async importCodingProblem(
        userId: string,
        problem: ValidatedCodingProblem,
        index: number,
        options: ImportOptionsDto,
        duplicates: ImportResultDto['duplicates'],
        result: ImportResultDto
    ): Promise<{ id: string } | null> {
        const isDuplicateSkip = this.duplicateHandler.shouldSkip(
            'codingProblem',
            problem.slug,
            duplicates,
            options.duplicateResolutions
        );

        if (isDuplicateSkip && options.duplicateMode !== DuplicateMode.OVERWRITE) {
            result.skippedCount++;
            return null;
        }

        const shouldOverwrite =
            options.duplicateMode === DuplicateMode.OVERWRITE ||
            this.duplicateHandler.shouldOverwrite(
                'codingProblem',
                problem.slug,
                duplicates,
                options.duplicateResolutions
            );

        // If overwriting, delete existing
        if (shouldOverwrite) {
            const existingId = this.duplicateHandler.getExistingId(
                'codingProblem',
                problem.slug,
                duplicates
            );
            if (existingId) {
                // Delete related data first
                await this.prisma.submission.deleteMany({ where: { problemId: existingId } });
                await this.prisma.testCase.deleteMany({ where: { problemId: existingId } });
                await this.prisma.problemsOnLists.deleteMany({ where: { problemId: existingId } });
                await this.prisma.interviewQuestion.deleteMany({ where: { problemId: existingId } });
                await this.prisma.problem.delete({ where: { id: existingId } });
                result.overwrittenCount++;
            }
        }

        // Create the problem
        const created = await this.prisma.problem.create({
            data: {
                slug: problem.slug,
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty as Difficulty,
                type: (problem.type || 'ALGORITHM') as ProblemType,
                starterCode: problem.starterCode,
                className: problem.className,
                tags: problem.tags || [],
                inputTypes: problem.inputTypes || [],
                returnType: problem.returnType,
                timeoutMs: problem.timeoutMs || 2000,
                memoryLimitMb: problem.memoryLimitMb || 128,
                timeLimit: problem.timeLimit || 45,
                userId,
                testCases: {
                    create: (problem.testCases || []).map(tc => ({
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden || false,
                    })),
                },
            },
        });

        result.importedCount.codingProblems++;
        result.importedCount.testCases += problem.testCases?.length || 0;

        // Import solutions as submissions marked as solutions
        if (problem.solutions && problem.solutions.length > 0) {
            for (const solution of problem.solutions) {
                await this.prisma.submission.create({
                    data: {
                        code: solution.code,
                        language: solution.language,
                        status: 'ACCEPTED',
                        output: '',
                        executionTime: solution.executionTime,
                        memoryUsed: solution.memoryUsed,
                        isSolution: true,
                        solutionName: solution.name,
                        problemId: created.id,
                        userId,
                    },
                });
                result.importedCount.submissions++;
            }
        }

        // Import submissions if included
        if (problem.submissions && problem.submissions.length > 0) {
            for (const submission of problem.submissions) {
                await this.prisma.submission.create({
                    data: {
                        code: submission.code,
                        language: submission.language,
                        status: submission.status,
                        output: submission.output,
                        executionTime: submission.executionTime,
                        memoryUsed: submission.memoryUsed,
                        createdAt: new Date(submission.createdAt),
                        problemId: created.id,
                        userId,
                    },
                });
                result.importedCount.submissions++;
            }
        }

        return { id: created.id };
    }

    /**
     * Import a single system design problem
     */
    private async importSystemDesignProblem(
        userId: string,
        problem: ValidatedSystemDesignProblem,
        index: number,
        options: ImportOptionsDto,
        duplicates: ImportResultDto['duplicates'],
        result: ImportResultDto
    ): Promise<{ id: string } | null> {
        const isDuplicateSkip = this.duplicateHandler.shouldSkip(
            'systemDesignProblem',
            problem.slug,
            duplicates,
            options.duplicateResolutions
        );

        if (isDuplicateSkip && options.duplicateMode !== DuplicateMode.OVERWRITE) {
            result.skippedCount++;
            return null;
        }

        const shouldOverwrite =
            options.duplicateMode === DuplicateMode.OVERWRITE ||
            this.duplicateHandler.shouldOverwrite(
                'systemDesignProblem',
                problem.slug,
                duplicates,
                options.duplicateResolutions
            );

        if (shouldOverwrite) {
            const existingId = this.duplicateHandler.getExistingId(
                'systemDesignProblem',
                problem.slug,
                duplicates
            );
            if (existingId) {
                await this.prisma.systemDesignSubmission.deleteMany({ where: { problemId: existingId } });
                await this.prisma.systemDesignSolution.deleteMany({ where: { problemId: existingId } });
                await this.prisma.systemDesignProblemsOnLists.deleteMany({ where: { problemId: existingId } });
                await this.prisma.systemDesignProblem.delete({ where: { id: existingId } });
                result.overwrittenCount++;
            }
        }

        const created = await this.prisma.systemDesignProblem.create({
            data: {
                slug: problem.slug,
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty as Difficulty,
                defaultDuration: problem.defaultDuration || 45,
                tags: problem.tags || [],
                constraints: problem.constraints || [],
                userId,
            },
        });

        result.importedCount.systemDesignProblems++;

        // Import solutions
        if (problem.solutions && problem.solutions.length > 0) {
            for (const solution of problem.solutions) {
                await this.prisma.systemDesignSolution.create({
                    data: {
                        title: solution.title,
                        description: solution.description,
                        diagramSnapshot: solution.diagramSnapshot,
                        excalidrawJson: solution.excalidrawJson,
                        author: solution.author,
                        problemId: created.id,
                    },
                });
            }
        }

        // Import submissions
        if (problem.submissions && problem.submissions.length > 0) {
            for (const submission of problem.submissions) {
                await this.prisma.systemDesignSubmission.create({
                    data: {
                        excalidrawJson: submission.excalidrawJson,
                        notesMarkdown: submission.notesMarkdown,
                        timeSpentSeconds: submission.timeSpentSeconds || 0,
                        status: submission.status || 'in_progress',
                        score: submission.score,
                        feedback: submission.feedback,
                        aiAnalysis: submission.aiAnalysis,
                        createdAt: new Date(submission.createdAt),
                        problemId: created.id,
                        userId,
                    },
                });
                result.importedCount.submissions++;
            }
        }

        return { id: created.id };
    }

    /**
     * Import a single list
     */
    private async importList(
        userId: string,
        list: ValidatedList,
        index: number,
        options: ImportOptionsDto,
        duplicates: ImportResultDto['duplicates'],
        problemSlugToId: Map<string, string>,
        systemDesignSlugToId: Map<string, string>,
        result: ImportResultDto
    ): Promise<void> {
        const isDuplicateSkip = this.duplicateHandler.shouldSkip(
            'list',
            list.name,
            duplicates,
            options.duplicateResolutions
        );

        if (isDuplicateSkip && options.duplicateMode !== DuplicateMode.OVERWRITE) {
            result.skippedCount++;
            return;
        }

        const shouldOverwrite =
            options.duplicateMode === DuplicateMode.OVERWRITE ||
            this.duplicateHandler.shouldOverwrite(
                'list',
                list.name,
                duplicates,
                options.duplicateResolutions
            );

        if (shouldOverwrite) {
            const existingId = this.duplicateHandler.getExistingId(
                'list',
                list.name,
                duplicates
            );
            if (existingId) {
                await this.prisma.list.delete({ where: { id: existingId } });
                result.overwrittenCount++;
            }
        }

        // Resolve problem slugs to IDs
        const problemIds: string[] = [];
        for (const slug of list.problemSlugs || []) {
            const id = problemSlugToId.get(slug);
            if (id) {
                problemIds.push(id);
            } else {
                result.errors.push(
                    this.errorAggregator.createMissingReferenceError(
                        'list',
                        index,
                        'problemSlugs',
                        slug
                    )
                );
            }
        }

        const systemDesignIds: string[] = [];
        for (const slug of list.systemDesignProblemSlugs || []) {
            const id = systemDesignSlugToId.get(slug);
            if (id) {
                systemDesignIds.push(id);
            } else {
                result.errors.push(
                    this.errorAggregator.createMissingReferenceError(
                        'list',
                        index,
                        'systemDesignProblemSlugs',
                        slug
                    )
                );
            }
        }

        // Create the list
        const created = await this.prisma.list.create({
            data: {
                name: list.name,
                description: list.description,
                userId,
            },
        });

        // Add problems to list
        if (problemIds.length > 0) {
            await this.prisma.problemsOnLists.createMany({
                data: problemIds.map(pid => ({
                    listId: created.id,
                    problemId: pid,
                })),
                skipDuplicates: true,
            });
        }

        if (systemDesignIds.length > 0) {
            await this.prisma.systemDesignProblemsOnLists.createMany({
                data: systemDesignIds.map(pid => ({
                    listId: created.id,
                    problemId: pid,
                })),
                skipDuplicates: true,
            });
        }

        result.importedCount.lists++;
    }
}
