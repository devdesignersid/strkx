import { apiClient } from './client';

/**
 * Export Options
 */
export interface ExportOptions {
    includeCodingProblems?: boolean;
    includeSystemDesignProblems?: boolean;
    includeLists?: boolean;
    includeTestCases?: boolean;
    includeSubmissions?: boolean;
    includeSolutions?: boolean;
    problemIds?: string[];
    systemDesignProblemIds?: string[];
    listIds?: string[];
}

/**
 * Import Options
 */
export interface ImportOptions {
    duplicateMode?: 'skip' | 'overwrite' | 'ask';
    duplicateResolutions?: DuplicateResolution[];
}

export interface DuplicateResolution {
    itemType: 'codingProblem' | 'systemDesignProblem' | 'list';
    slug: string;
    action: 'skip' | 'overwrite';
}

/**
 * Import Error
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
 * Duplicate Information
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
 * Import Preview Result
 */
export interface ImportPreview {
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

/**
 * Import Result
 */
export interface ImportResult {
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
    duplicates: DuplicateInfo[];
    warnings: string[];
}

/**
 * Data Port API Service
 *
 * Provides methods for exporting and importing user data.
 */
export const dataPortService = {
    /**
     * Export user data as JSON file
     * @param options - Export configuration options
     * @returns Blob of JSON data
     */
    exportData: async (options: ExportOptions): Promise<Blob> => {
        const response = await apiClient.post('/data-port/export', options, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Export user data and return as object (for preview)
     * @param options - Export configuration options
     * @returns Export data object and filename
     */
    exportPreview: async (options: ExportOptions): Promise<{ data: any; filename: string }> => {
        const response = await apiClient.post('/data-port/export/preview', options);
        // Handle wrapped response
        const payload = response.data as any;
        return payload.data ? payload.data : payload;
    },

    /**
     * Preview import data without actually importing
     * @param file - JSON file to preview
     * @returns Import preview with counts and validation errors
     */
    previewImport: async (file: File): Promise<ImportPreview> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/data-port/import/preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const payload = response.data as any;
        return payload.data ? payload.data : payload;
    },

    /**
     * Preview import from JSON object
     * @param data - JSON data object
     * @returns Import preview with counts and validation errors
     */
    previewImportFromData: async (data: unknown): Promise<ImportPreview> => {
        const response = await apiClient.post('/data-port/import/preview', {
            data: JSON.stringify(data),
        });
        const payload = response.data as any;
        return payload.data ? payload.data : payload;
    },

    /**
     * Import data from JSON file
     * @param file - JSON file to import
     * @param options - Import options (duplicate handling mode)
     * @returns Import result with counts and errors
     */
    importFromFile: async (file: File, options: ImportOptions = {}): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('options', JSON.stringify(options));
        const response = await apiClient.post('/data-port/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const payload = response.data as any;
        return payload.data ? payload.data : payload;
    },

    /**
     * Import data from JSON object
     * @param data - JSON data object
     * @param options - Import options
     * @returns Import result
     */
    importFromData: async (data: unknown, options: ImportOptions = {}): Promise<ImportResult> => {
        const response = await apiClient.post('/data-port/import', {
            data: JSON.stringify(data),
            options: JSON.stringify(options),
        });
        const payload = response.data as any;
        return payload.data ? payload.data : payload;
    },

    /**
     * Resolve duplicates after initial import returned ASK mode
     * @param data - Original import data
     * @param resolutions - User's decisions for each duplicate
     * @returns Final import result
     */
    resolveImportDuplicates: async (
        data: unknown,
        resolutions: DuplicateResolution[]
    ): Promise<ImportResult> => {
        const response = await apiClient.post('/data-port/import/resolve', {
            data,
            options: { duplicateResolutions: resolutions },
        });
        const payload = response.data as any;
        return payload.data ? payload.data : payload;
    },

    /**
     * Download export data as a file
     * @param blob - Blob data
     * @param filename - Optional custom filename
     */
    downloadFile: (blob: Blob, filename?: string): void => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `strkx-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};
