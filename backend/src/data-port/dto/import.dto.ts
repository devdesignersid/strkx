import {
    IsEnum,
    IsOptional,
    IsArray,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Duplicate handling modes
 */
export enum DuplicateMode {
    SKIP = 'skip',       // Skip duplicate items entirely
    OVERWRITE = 'overwrite', // Delete existing and import new
    ASK = 'ask',         // Return duplicates for user decision
}

/**
 * Resolution for a specific duplicate item
 */
export class DuplicateResolution {
    @IsString()
    itemType: 'codingProblem' | 'systemDesignProblem' | 'list';

    @IsString()
    slug: string;

    @IsEnum(['skip', 'overwrite'])
    action: 'skip' | 'overwrite';
}

/**
 * Import Options DTO
 */
export class ImportOptionsDto {
    @IsEnum(DuplicateMode)
    @IsOptional()
    duplicateMode?: DuplicateMode = DuplicateMode.ASK;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DuplicateResolution)
    duplicateResolutions?: DuplicateResolution[];
}

/**
 * Structured import error with contextual information
 */
export interface ImportError {
    itemIndex: number;
    itemType: 'codingProblem' | 'systemDesignProblem' | 'list' | 'testCase' | 'submission';
    field: string;
    expected: string;
    actual: string;
    message: string;
    path: string[];
}

/**
 * Information about a detected duplicate
 */
export interface DuplicateInfo {
    itemType: 'codingProblem' | 'systemDesignProblem' | 'list';
    existingId: string;
    existingSlug: string;
    existingTitle: string;
    incomingIndex: number;
    incomingSlug: string;
    incomingTitle: string;
}

/**
 * Complete result of an import operation
 */
export interface ImportResultDto {
    success: boolean;
    importedCount: {
        codingProblems: number;
        systemDesignProblems: number;
        lists: number;
        testCases: number;
        submissions: number;
    };
    skippedCount: number;
    overwrittenCount: number;
    errors: ImportError[];
    duplicates: DuplicateInfo[]; // Only populated when mode is ASK
    warnings: string[];
}

/**
 * Preview of import data before actual import
 */
export interface ImportPreviewDto {
    isValid: boolean;
    version: string;
    counts: {
        codingProblems: number;
        systemDesignProblems: number;
        lists: number;
        totalTestCases: number;
    };
    errors: ImportError[];
    warnings: string[];
}
