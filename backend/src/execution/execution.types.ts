import { User } from '@prisma/client';

/**
 * Result of executing a single test case.
 */
export interface TestCaseResult {
    testCaseId: string;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    error?: string;
    logs: string[];
    executionTimeMs: number;
    memoryUsedBytes: number;
}

/**
 * Result from the worker thread execution.
 */
export interface WorkerResult {
    success: boolean;
    result: unknown;
    logs: string[];
    message?: string;
}

/**
 * Context passed to the worker thread.
 */
export interface WorkerContext {
    args: unknown[];
    commands?: string[];
    values?: unknown[][];
    timeoutMs: number;
    memoryLimitMb: number;
}

/**
 * Parsed input for design problems.
 */
export interface DesignProblemInput {
    commands: string[];
    values: unknown[][];
}

/**
 * User type for execution service (subset of User).
 */
export type ExecutionUser = Pick<User, 'id'>;
