import { Injectable } from '@nestjs/common';
import { ImportError } from '../dto/import.dto';

/**
 * ErrorAggregator
 * 
 * Collects and aggregates errors during import without stopping the process.
 * Provides structured error objects for detailed reporting.
 */
@Injectable()
export class ErrorAggregator {
    /**
     * Add an error to the result errors array
     */
    addError(
        errors: ImportError[],
        error: ImportError
    ): void {
        errors.push(error);
    }

    /**
     * Create a structured error from a Zod validation error
     */
    fromZodError(
        zodError: any,
        itemType: ImportError['itemType'],
        itemIndex: number
    ): ImportError[] {
        if (!zodError.issues) {
            return [{
                itemIndex,
                itemType,
                field: 'unknown',
                expected: 'valid data',
                actual: 'invalid data',
                message: zodError.message || 'Validation failed',
                path: [itemType + 's', String(itemIndex)],
            }];
        }

        return zodError.issues.map((issue: any) => ({
            itemIndex,
            itemType,
            field: issue.path.join('.'),
            expected: this.getExpectedFromIssue(issue),
            actual: this.getActualFromIssue(issue),
            message: issue.message,
            path: [itemType + 's', String(itemIndex), ...issue.path.map(String)],
        }));
    }

    /**
     * Create an error for a missing reference (e.g., problem slug not found in list)
     */
    createMissingReferenceError(
        itemType: ImportError['itemType'],
        itemIndex: number,
        field: string,
        missingValue: string
    ): ImportError {
        return {
            itemIndex,
            itemType,
            field,
            expected: 'existing problem slug',
            actual: missingValue,
            message: `Referenced slug "${missingValue}" not found. Make sure the problem is included in the import or already exists.`,
            path: [itemType + 's', String(itemIndex), field],
        };
    }

    /**
     * Create an error for database operation failure
     */
    createDatabaseError(
        itemType: ImportError['itemType'],
        itemIndex: number,
        operation: string,
        errorMessage: string
    ): ImportError {
        return {
            itemIndex,
            itemType,
            field: 'database',
            expected: `successful ${operation}`,
            actual: 'error',
            message: `Database ${operation} failed: ${errorMessage}`,
            path: [itemType + 's', String(itemIndex)],
        };
    }

    /**
     * Create a warning string (for non-fatal issues)
     */
    createWarning(message: string): string {
        return message;
    }

    private getExpectedFromIssue(issue: any): string {
        switch (issue.code) {
            case 'invalid_type':
                return issue.expected;
            case 'invalid_enum_value':
                return issue.options?.join(' | ') || 'valid enum value';
            case 'too_small':
                return `minimum ${issue.minimum}`;
            case 'too_big':
                return `maximum ${issue.maximum}`;
            case 'invalid_string':
                return issue.validation || 'valid string format';
            default:
                return 'valid value';
        }
    }

    private getActualFromIssue(issue: any): string {
        switch (issue.code) {
            case 'invalid_type':
                return issue.received;
            case 'invalid_enum_value':
                return String(issue.received);
            default:
                return 'invalid value';
        }
    }
}
