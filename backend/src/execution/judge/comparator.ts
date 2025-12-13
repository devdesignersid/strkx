/**
 * LeetCode-compatible Judge Comparator Module
 * 
 * This module provides comparison logic for evaluating user solutions
 * against expected outputs. It supports multiple comparison strategies
 * to handle different problem types accurately.
 * 
 * Comparison Types:
 * - STRICT: Exact match (default) - order and values must match exactly
 * - ORDER_INSENSITIVE: Elements match regardless of order (any dimension)
 * - FLOAT_TOLERANCE: Numbers match within tolerance (for precision problems)
 */

export enum ComparisonType {
    STRICT = 'STRICT',
    ORDER_INSENSITIVE = 'ORDER_INSENSITIVE',
    FLOAT_TOLERANCE = 'FLOAT_TOLERANCE',
    SUBSET_MATCH = 'SUBSET_MATCH', // Any valid answer from a set of valid answers
}

// Default tolerance for float comparison (10^-5 like LeetCode)
const DEFAULT_FLOAT_TOLERANCE = 1e-5;

/**
 * Main comparison function - entry point for all comparisons
 */
export function compare(
    actual: unknown,
    expected: unknown,
    comparisonType: ComparisonType = ComparisonType.STRICT,
    floatTolerance: number = DEFAULT_FLOAT_TOLERANCE
): boolean {
    switch (comparisonType) {
        case ComparisonType.ORDER_INSENSITIVE:
            return compareOrderInsensitive(actual, expected);
        case ComparisonType.FLOAT_TOLERANCE:
            return compareWithFloatTolerance(actual, expected, floatTolerance);
        case ComparisonType.SUBSET_MATCH:
            return compareSubsetMatch(actual, expected);
        case ComparisonType.STRICT:
        default:
            return compareStrict(actual, expected);
    }
}

/**
 * STRICT comparison - exact match required
 * Handles null vs [] equivalence for data structures
 */
export function compareStrict(actual: unknown, expected: unknown): boolean {
    // Fast path: JSON string equality
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr === expectedStr) return true;

    // Special handling for empty structures (null vs [])
    // Many problems treat null and [] as equivalent for empty Lists/Trees/Graphs
    if (
        (actual === null && Array.isArray(expected) && expected.length === 0) ||
        (expected === null && Array.isArray(actual) && actual.length === 0)
    ) {
        return true;
    }

    return false;
}

/**
 * ORDER_INSENSITIVE comparison - elements match regardless of order
 * Works recursively for arrays of any dimension (1D, 2D, 3D, etc.)
 * 
 * Examples:
 * - [1, 2, 3] equals [3, 1, 2]
 * - [[1,2], [3,4]] equals [[3,4], [1,2]]
 * - [["a","b"], ["c"]] equals [["c"], ["b","a"]]
 */
export function compareOrderInsensitive(actual: unknown, expected: unknown): boolean {
    // Handle null/undefined
    if (actual === null || actual === undefined) {
        if (expected === null || expected === undefined) return true;
        if (Array.isArray(expected) && expected.length === 0) return true;
        return false;
    }
    if (expected === null || expected === undefined) {
        if (Array.isArray(actual) && actual.length === 0) return true;
        return false;
    }

    // Both must be arrays for order-insensitive comparison
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
        // If not arrays, fall back to strict comparison
        return compareStrict(actual, expected);
    }

    // Length must match
    if (actual.length !== expected.length) return false;

    // Empty arrays
    if (actual.length === 0) return true;

    // Normalize both arrays recursively and compare
    const normalizedActual = normalizeArray(actual);
    const normalizedExpected = normalizeArray(expected);

    return JSON.stringify(normalizedActual) === JSON.stringify(normalizedExpected);
}

/**
 * Normalize an array for order-insensitive comparison
 * - Recursively sorts nested arrays
 * - Creates a canonical string representation for sorting
 */
function normalizeArray(arr: unknown[]): unknown[] {
    // Process each element
    const processed = arr.map(item => {
        if (Array.isArray(item)) {
            // Recursively normalize nested arrays
            return normalizeArray(item);
        }
        return item;
    });

    // Sort the array using canonical string representation
    return processed.sort((a, b) => {
        const aStr = canonicalize(a);
        const bStr = canonicalize(b);
        return aStr.localeCompare(bStr);
    });
}

/**
 * Create a canonical string representation for sorting
 * Handles nested arrays, objects, and primitives
 */
function canonicalize(value: unknown): string {
    if (Array.isArray(value)) {
        // For arrays, sort elements first then stringify
        const sorted = normalizeArray(value);
        return JSON.stringify(sorted);
    }
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
        // Sort object keys for consistent ordering
        const sorted = Object.keys(value as object)
            .sort()
            .reduce((acc, key) => {
                acc[key] = (value as Record<string, unknown>)[key];
                return acc;
            }, {} as Record<string, unknown>);
        return JSON.stringify(sorted);
    }
    return JSON.stringify(value);
}

/**
 * FLOAT_TOLERANCE comparison - numbers match within tolerance
 * For problems involving floating point precision (e.g., geometry, probability)
 * 
 * Default tolerance: 10^-5 (matches LeetCode's standard)
 */
export function compareWithFloatTolerance(
    actual: unknown,
    expected: unknown,
    tolerance: number = DEFAULT_FLOAT_TOLERANCE
): boolean {
    // Both numbers - check tolerance
    if (typeof actual === 'number' && typeof expected === 'number') {
        // Handle special cases
        if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
        if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
            return actual === expected; // Infinity checks
        }
        return Math.abs(actual - expected) <= tolerance;
    }

    // Both arrays - compare element by element
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        return actual.every((val, idx) =>
            compareWithFloatTolerance(val, expected[idx], tolerance)
        );
    }

    // Both objects - compare property by property
    if (
        typeof actual === 'object' && actual !== null &&
        typeof expected === 'object' && expected !== null &&
        !Array.isArray(actual) && !Array.isArray(expected)
    ) {
        const actualKeys = Object.keys(actual);
        const expectedKeys = Object.keys(expected as object);
        if (actualKeys.length !== expectedKeys.length) return false;
        return actualKeys.every(key =>
            compareWithFloatTolerance(
                (actual as Record<string, unknown>)[key],
                (expected as Record<string, unknown>)[key],
                tolerance
            )
        );
    }

    // Fallback to strict comparison for other types
    return compareStrict(actual, expected);
}

/**
 * SUBSET_MATCH comparison - for problems with multiple valid answers
 * Expected can be a single value OR an array of valid answers
 * Actual passes if it matches any of the valid answers
 * 
 * Examples:
 * - Expected: [[0,1], [1,0]] (Two Sum can return either)
 * - Actual: [1,0] -> passes
 * - Expected: ["abc", "bac", "cab"] (Permutation problems)
 * - Actual: "bac" -> passes
 */
export function compareSubsetMatch(actual: unknown, expected: unknown): boolean {
    // If expected is an array of arrays (multiple valid answers)
    if (Array.isArray(expected) && expected.length > 0) {
        // Check if this looks like multiple valid answers vs single array answer
        // If first element and actual have same structure, treat as multiple options
        const firstExpected = expected[0];

        // Check if actual matches any of the expected options
        for (const option of expected) {
            if (compareOrderInsensitive(actual, option)) {
                return true;
            }
        }

        // Also check if actual matches expected as a whole (single answer case)
        if (compareOrderInsensitive(actual, expected)) {
            return true;
        }
    }

    // Single expected value
    return compareOrderInsensitive(actual, expected);
}


/**
 * Utility: Check if comparison type is valid
 */
export function isValidComparisonType(type: string): type is ComparisonType {
    return Object.values(ComparisonType).includes(type as ComparisonType);
}

/**
 * Utility: Get comparison type from string with fallback to STRICT
 */
export function getComparisonType(type: string | null | undefined): ComparisonType {
    if (type && isValidComparisonType(type)) {
        return type;
    }
    return ComparisonType.STRICT;
}
