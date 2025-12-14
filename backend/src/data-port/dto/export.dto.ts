import {
    IsBoolean,
    IsOptional,
    IsArray,
    IsString,
} from 'class-validator';

/**
 * Export Options DTO
 * 
 * Configures what data to include in the export.
 */
export class ExportOptionsDto {
    // Entity selection - which main types to export
    @IsBoolean()
    @IsOptional()
    includeCodingProblems?: boolean = true;

    @IsBoolean()
    @IsOptional()
    includeSystemDesignProblems?: boolean = true;

    @IsBoolean()
    @IsOptional()
    includeLists?: boolean = true;

    // Optional data toggles - additional data to include
    @IsBoolean()
    @IsOptional()
    includeTestCases?: boolean = true;

    @IsBoolean()
    @IsOptional()
    includeSubmissions?: boolean = false;

    @IsBoolean()
    @IsOptional()
    includeSolutions?: boolean = true;

    // Specific entity IDs to export (if empty, exports all)
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    problemIds?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    systemDesignProblemIds?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    listIds?: string[];
}

/**
 * Exported Test Case structure
 */
export interface ExportedTestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

/**
 * Exported Solution structure (for coding problems)
 */
export interface ExportedSolution {
    name: string;
    code: string;
    language: string;
    executionTime?: number;
    memoryUsed?: number;
}

/**
 * Exported Submission structure (for coding problems)
 */
export interface ExportedSubmission {
    code: string;
    language: string;
    status: string;
    output: string;
    executionTime?: number;
    memoryUsed?: number;
    isSolution?: boolean;  // Whether this submission is marked as a solution
    solutionName?: string; // Name for the solution (if isSolution is true)
    createdAt: string;
}

/**
 * Exported Coding Problem structure
 */
export interface ExportedCodingProblem {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    type: string;
    starterCode?: string;
    className?: string;
    tags: string[];
    inputTypes: string[];
    returnType?: string;
    comparisonType?: string;  // Output comparison strategy: STRICT, ORDER_INSENSITIVE, FLOAT_TOLERANCE, SUBSET_MATCH
    timeoutMs: number;
    memoryLimitMb: number;
    timeLimit: number;
    testCases?: ExportedTestCase[];
    solutions?: ExportedSolution[];
    submissions?: ExportedSubmission[];
}

/**
 * Exported System Design Submission structure
 */
export interface ExportedSystemDesignSubmission {
    excalidrawJson: any;
    notesMarkdown?: string;
    timeSpentSeconds: number;
    status: string;
    isSolution?: boolean;  // Whether this submission is marked as a solution
    solutionName?: string; // Name for the solution (if isSolution is true)
    score?: number;
    createdAt: string;
}

/**
 * Exported System Design Solution structure
 */
export interface ExportedSystemDesignSolution {
    title: string;
    description: string;
    diagramSnapshot?: string;
    excalidrawJson?: any;
    author?: string;
}

/**
 * Exported System Design Problem structure
 */
export interface ExportedSystemDesignProblem {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    defaultDuration: number;
    tags: string[];
    constraints: string[];
    solutions?: ExportedSystemDesignSolution[];
    submissions?: ExportedSystemDesignSubmission[];
}

/**
 * Exported List structure
 * Uses slug references to problems for portability
 */
export interface ExportedList {
    name: string;
    description?: string;
    problemSlugs: string[];
    systemDesignProblemSlugs: string[];
}

/**
 * Complete Export Data structure
 */
export interface ExportData {
    version: string;
    exportedAt: string;
    codingProblems: ExportedCodingProblem[];
    systemDesignProblems: ExportedSystemDesignProblem[];
    lists: ExportedList[];
}
