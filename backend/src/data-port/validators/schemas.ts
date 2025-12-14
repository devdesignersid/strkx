import { z } from 'zod';

/**
 * Current export schema version
 * Increment when making breaking changes to the export format
 */
export const CURRENT_EXPORT_VERSION = '1.0.0';

/**
 * Supported versions for import (for backward compatibility)
 */
export const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Size limits for security
 */
export const IMPORT_LIMITS = {
    MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
    MAX_PROBLEMS: 1000,
    MAX_SYSTEM_DESIGN_PROBLEMS: 500,
    MAX_LISTS: 200,
    MAX_TEST_CASES_PER_PROBLEM: 100,
    MAX_SUBMISSIONS_PER_PROBLEM: 500,
};

// ============================================
// Test Case Schema
// ============================================
export const TestCaseSchema = z.object({
    input: z.string({ message: 'Test case input is required and must be a string' }),
    expectedOutput: z.string({ message: 'Expected output is required and must be a string' }),
    isHidden: z.boolean().optional().default(false),
});

// ============================================
// Solution Schema (for coding problems)
// ============================================
export const SolutionSchema = z.object({
    name: z.string().min(1, 'Solution name is required').max(100),
    code: z.string().min(1, 'Solution code is required'),
    language: z.string().min(1, 'Language is required'),
    executionTime: z.number().optional(),
    memoryUsed: z.number().optional(),
});

// ============================================
// Submission Schema (for coding problems)
// ============================================
export const SubmissionSchema = z.object({
    code: z.string().min(1, 'Submission code is required'),
    language: z.string().min(1, 'Language is required'),
    status: z.string().min(1, 'Status is required'),
    output: z.string(),
    executionTime: z.number().optional(),
    memoryUsed: z.number().optional(),
    isSolution: z.boolean().optional().default(false),
    solutionName: z.string().optional(),
    createdAt: z.string().datetime({ message: 'Invalid datetime format' }),
});

// ============================================
// Coding Problem Schema
// ============================================
export const CodingProblemSchema = z.object({
    slug: z.string()
        .min(1, 'Slug is required')
        .max(200, 'Slug must be at most 200 characters'),
    title: z.string()
        .min(1, 'Title is required')
        .max(500, 'Title must be at most 500 characters'),
    description: z.string()
        .min(1, 'Description is required')
        .max(100000, 'Description must be at most 100000 characters'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
        message: "Difficulty must be 'Easy', 'Medium', or 'Hard'",
    }),
    type: z.enum(['ALGORITHM', 'DESIGN']).optional().default('ALGORITHM'),
    starterCode: z.string().optional(),
    className: z.string().optional(),
    tags: z.array(z.string().max(100)).optional().default([]),
    inputTypes: z.array(z.string()).optional().default([]),
    returnType: z.string().optional(),
    comparisonType: z.enum(['STRICT', 'ORDER_INSENSITIVE', 'FLOAT_TOLERANCE', 'SUBSET_MATCH']).optional().default('STRICT'),
    timeoutMs: z.number().int().positive().optional().default(2000),
    memoryLimitMb: z.number().int().positive().optional().default(128),
    timeLimit: z.number().int().positive().optional().default(45),
    testCases: z.array(TestCaseSchema)
        .max(IMPORT_LIMITS.MAX_TEST_CASES_PER_PROBLEM, `Maximum ${IMPORT_LIMITS.MAX_TEST_CASES_PER_PROBLEM} test cases per problem`)
        .optional()
        .default([]),
    solutions: z.array(SolutionSchema).optional().default([]),
    submissions: z.array(SubmissionSchema)
        .max(IMPORT_LIMITS.MAX_SUBMISSIONS_PER_PROBLEM, `Maximum ${IMPORT_LIMITS.MAX_SUBMISSIONS_PER_PROBLEM} submissions per problem`)
        .optional()
        .default([]),
});

// ============================================
// System Design Submission Schema
// ============================================
export const SystemDesignSubmissionSchema = z.object({
    excalidrawJson: z.any(), // JSON can be any structure
    notesMarkdown: z.string().optional(),
    timeSpentSeconds: z.number().int().min(0).default(0),
    status: z.string().default('in_progress'),
    isSolution: z.boolean().optional().default(false),
    solutionName: z.string().optional(),
    score: z.number().int().min(0).max(100).optional(),
    createdAt: z.string().datetime({ message: 'Invalid datetime format' }),
});

// ============================================
// System Design Solution Schema
// ============================================
export const SystemDesignSolutionSchema = z.object({
    title: z.string().min(1, 'Solution title is required').max(200),
    description: z.string().min(1, 'Solution description is required'),
    diagramSnapshot: z.string().optional(),
    excalidrawJson: z.any().optional(),
    author: z.string().optional(),
});

// ============================================
// System Design Problem Schema
// ============================================
export const SystemDesignProblemSchema = z.object({
    slug: z.string()
        .min(1, 'Slug is required')
        .max(200, 'Slug must be at most 200 characters'),
    title: z.string()
        .min(1, 'Title is required')
        .max(500, 'Title must be at most 500 characters'),
    description: z.string()
        .min(1, 'Description is required')
        .max(100000, 'Description must be at most 100000 characters'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
        message: "Difficulty must be 'Easy', 'Medium', or 'Hard'",
    }),
    defaultDuration: z.number().int().positive().optional().default(45),
    tags: z.array(z.string().max(100)).optional().default([]),
    constraints: z.array(z.string()).optional().default([]),
    solutions: z.array(SystemDesignSolutionSchema).optional().default([]),
    submissions: z.array(SystemDesignSubmissionSchema).optional().default([]),
});

// ============================================
// List Schema
// ============================================
export const ListSchema = z.object({
    name: z.string()
        .min(1, 'List name is required')
        .max(200, 'List name must be at most 200 characters'),
    description: z.string().max(5000).optional(),
    problemSlugs: z.array(z.string()).optional().default([]),
    systemDesignProblemSlugs: z.array(z.string()).optional().default([]),
});

// ============================================
// Root Export Data Schema
// ============================================
export const ExportDataSchema = z.object({
    version: z.string({ message: 'Export version is required' }),
    exportedAt: z.string().datetime({
        message: 'Invalid export timestamp format',
    }),
    codingProblems: z.array(CodingProblemSchema)
        .max(IMPORT_LIMITS.MAX_PROBLEMS, `Maximum ${IMPORT_LIMITS.MAX_PROBLEMS} coding problems allowed`)
        .optional()
        .default([]),
    systemDesignProblems: z.array(SystemDesignProblemSchema)
        .max(IMPORT_LIMITS.MAX_SYSTEM_DESIGN_PROBLEMS, `Maximum ${IMPORT_LIMITS.MAX_SYSTEM_DESIGN_PROBLEMS} system design problems allowed`)
        .optional()
        .default([]),
    lists: z.array(ListSchema)
        .max(IMPORT_LIMITS.MAX_LISTS, `Maximum ${IMPORT_LIMITS.MAX_LISTS} lists allowed`)
        .optional()
        .default([]),
});

// Type inference from schemas
export type ValidatedTestCase = z.infer<typeof TestCaseSchema>;
export type ValidatedCodingProblem = z.infer<typeof CodingProblemSchema>;
export type ValidatedSystemDesignProblem = z.infer<typeof SystemDesignProblemSchema>;
export type ValidatedList = z.infer<typeof ListSchema>;
export type ValidatedExportData = z.infer<typeof ExportDataSchema>;
