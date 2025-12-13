import {
    compare,
    compareStrict,
    compareOrderInsensitive,
    compareWithFloatTolerance,
    ComparisonType,
    getComparisonType,
    isValidComparisonType
} from './comparator';

describe('Comparator Module', () => {

    describe('compareStrict', () => {
        it('should return true for identical primitives', () => {
            expect(compareStrict(1, 1)).toBe(true);
            expect(compareStrict('hello', 'hello')).toBe(true);
            expect(compareStrict(true, true)).toBe(true);
            expect(compareStrict(null, null)).toBe(true);
        });

        it('should return false for different primitives', () => {
            expect(compareStrict(1, 2)).toBe(false);
            expect(compareStrict('a', 'b')).toBe(false);
            expect(compareStrict(true, false)).toBe(false);
        });

        it('should return true for identical arrays', () => {
            expect(compareStrict([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(compareStrict([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
        });

        it('should return false for arrays with different order', () => {
            expect(compareStrict([1, 2, 3], [3, 2, 1])).toBe(false);
            expect(compareStrict([[1, 2], [3, 4]], [[3, 4], [1, 2]])).toBe(false);
        });

        it('should treat null and empty array as equivalent', () => {
            expect(compareStrict(null, [])).toBe(true);
            expect(compareStrict([], null)).toBe(true);
        });

        it('should handle nested objects', () => {
            expect(compareStrict({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
            // Note: JSON.stringify may not preserve key order in all cases
            // Object comparison here is by serialization, so key order matters
        });
    });

    describe('compareOrderInsensitive', () => {
        describe('1D arrays', () => {
            it('should match arrays with same elements in different order', () => {
                expect(compareOrderInsensitive([1, 2, 3], [3, 1, 2])).toBe(true);
                expect(compareOrderInsensitive(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true);
            });

            it('should not match arrays with different elements', () => {
                expect(compareOrderInsensitive([1, 2, 3], [1, 2, 4])).toBe(false);
                expect(compareOrderInsensitive([1, 2], [1, 2, 3])).toBe(false);
            });

            it('should handle empty arrays', () => {
                expect(compareOrderInsensitive([], [])).toBe(true);
            });

            it('should handle single element arrays', () => {
                expect(compareOrderInsensitive([1], [1])).toBe(true);
                expect(compareOrderInsensitive([''], [''])).toBe(true);
                expect(compareOrderInsensitive(['a'], ['a'])).toBe(true);
            });
        });

        describe('2D arrays (Group Anagrams style)', () => {
            it('should match 2D arrays with groups in different order', () => {
                const actual = [['ate', 'eat', 'tea'], ['nat', 'tan'], ['bat']];
                const expected = [['bat'], ['tan', 'nat'], ['eat', 'tea', 'ate']];
                expect(compareOrderInsensitive(actual, expected)).toBe(true);
            });

            it('should match 2D arrays with inner elements in different order', () => {
                const actual = [['a', 'b'], ['c', 'd']];
                const expected = [['b', 'a'], ['d', 'c']];
                expect(compareOrderInsensitive(actual, expected)).toBe(true);
            });

            it('should not match 2D arrays with different content', () => {
                const actual = [['a', 'b'], ['c']];
                const expected = [['a', 'b'], ['d']];
                expect(compareOrderInsensitive(actual, expected)).toBe(false);
            });
        });

        describe('3D+ arrays', () => {
            it('should handle deeply nested arrays', () => {
                const actual = [[[1, 2], [3, 4]], [[5, 6]]];
                const expected = [[[5, 6]], [[4, 3], [2, 1]]];
                expect(compareOrderInsensitive(actual, expected)).toBe(true);
            });
        });

        describe('edge cases', () => {
            it('should handle null vs empty array', () => {
                expect(compareOrderInsensitive(null, [])).toBe(true);
                expect(compareOrderInsensitive([], null)).toBe(true);
                expect(compareOrderInsensitive(null, null)).toBe(true);
            });

            it('should handle arrays with duplicates', () => {
                expect(compareOrderInsensitive([1, 1, 2], [2, 1, 1])).toBe(true);
                expect(compareOrderInsensitive([1, 1, 2], [1, 2, 2])).toBe(false);
            });

            it('should fall back to strict for non-arrays', () => {
                expect(compareOrderInsensitive(5, 5)).toBe(true);
                expect(compareOrderInsensitive('hello', 'hello')).toBe(true);
                expect(compareOrderInsensitive({ a: 1 }, { a: 1 })).toBe(true);
            });
        });
    });

    describe('compareWithFloatTolerance', () => {
        it('should match numbers within tolerance', () => {
            expect(compareWithFloatTolerance(1.00001, 1.00002, 1e-4)).toBe(true);
            expect(compareWithFloatTolerance(0.123456, 0.123457, 1e-5)).toBe(true);
        });

        it('should not match numbers outside tolerance', () => {
            expect(compareWithFloatTolerance(1.0, 1.1, 1e-5)).toBe(false);
        });

        it('should handle arrays of floats', () => {
            expect(compareWithFloatTolerance(
                [1.00001, 2.00001],
                [1.00002, 2.00002],
                1e-4
            )).toBe(true);
        });

        it('should handle nested arrays of floats', () => {
            expect(compareWithFloatTolerance(
                [[1.00001], [2.00001]],
                [[1.00002], [2.00002]],
                1e-4
            )).toBe(true);
        });

        it('should handle special float values', () => {
            expect(compareWithFloatTolerance(NaN, NaN)).toBe(true);
            expect(compareWithFloatTolerance(Infinity, Infinity)).toBe(true);
            expect(compareWithFloatTolerance(-Infinity, -Infinity)).toBe(true);
            expect(compareWithFloatTolerance(Infinity, -Infinity)).toBe(false);
        });

        it('should fall back to strict for integers and strings', () => {
            expect(compareWithFloatTolerance(5, 5)).toBe(true);
            expect(compareWithFloatTolerance('a', 'a')).toBe(true);
        });
    });

    describe('compare (main function)', () => {
        it('should use STRICT by default', () => {
            expect(compare([1, 2], [2, 1])).toBe(false);
            expect(compare([1, 2], [1, 2])).toBe(true);
        });

        it('should use ORDER_INSENSITIVE when specified', () => {
            expect(compare([1, 2], [2, 1], ComparisonType.ORDER_INSENSITIVE)).toBe(true);
        });

        it('should use FLOAT_TOLERANCE when specified', () => {
            expect(compare(1.00001, 1.00002, ComparisonType.FLOAT_TOLERANCE)).toBe(true);
        });
    });

    describe('utility functions', () => {
        it('isValidComparisonType should validate correctly', () => {
            expect(isValidComparisonType('STRICT')).toBe(true);
            expect(isValidComparisonType('ORDER_INSENSITIVE')).toBe(true);
            expect(isValidComparisonType('FLOAT_TOLERANCE')).toBe(true);
            expect(isValidComparisonType('INVALID')).toBe(false);
            expect(isValidComparisonType('')).toBe(false);
        });

        it('getComparisonType should return correct type or default', () => {
            expect(getComparisonType('STRICT')).toBe(ComparisonType.STRICT);
            expect(getComparisonType('ORDER_INSENSITIVE')).toBe(ComparisonType.ORDER_INSENSITIVE);
            expect(getComparisonType(null)).toBe(ComparisonType.STRICT);
            expect(getComparisonType(undefined)).toBe(ComparisonType.STRICT);
            expect(getComparisonType('invalid')).toBe(ComparisonType.STRICT);
        });
    });

    describe('Input edge cases (empty strings and single elements)', () => {
        it('should correctly compare arrays with empty strings', () => {
            expect(compareStrict([''], [''])).toBe(true);
            expect(compareStrict([''], [])).toBe(false);
            expect(compareOrderInsensitive([''], [''])).toBe(true);
        });

        it('should correctly compare single element arrays', () => {
            expect(compareStrict(['a'], ['a'])).toBe(true);
            expect(compareStrict(['a'], ['b'])).toBe(false);
        });

        it('should distinguish empty array from array with empty string', () => {
            expect(compareStrict([], [''])).toBe(false);
            expect(compareOrderInsensitive([], [''])).toBe(false);
        });
    });

    describe('Two Sum regression test (order-sensitive)', () => {
        it('should fail when indices are in wrong order with STRICT', () => {
            // Two Sum expects [0, 1], user returns [1, 0] - should FAIL
            expect(compare([0, 1], [1, 0], ComparisonType.STRICT)).toBe(false);
        });

        it('should pass when indices are correct with STRICT', () => {
            expect(compare([0, 1], [0, 1], ComparisonType.STRICT)).toBe(true);
        });
    });
});
