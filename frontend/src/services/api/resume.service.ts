/**
 * Resume API Service
 * Handles resume persistence and versioning
 */

import { apiClient } from './client';
import type { ResumeContent, ResumeDesign } from '@/features/resume-builder/types/schema';

// API Response types
export interface ResumeVersionSummary {
    id: string;
    versionNumber: number;
    templateId: string;
    createdAt: string;
}

export interface ResumeVersionFull {
    id: string;
    versionNumber: number;
    contentJSON: ResumeContent;
    designJSON: ResumeDesign;
    templateId: string;
    createdAt: string;
}

export interface ResumeResponse {
    id: string;
    userId: string;
    latestVersionNumber: number;
    versions: ResumeVersionFull[];
    createdAt: string;
    updatedAt: string;
}

interface CreateVersionPayload {
    contentJSON: ResumeContent;
    designJSON: ResumeDesign;
    templateId: string;
}

// Backend wraps responses in { data: T, statusCode, timestamp }
interface ApiResponse<T> {
    data: T;
    statusCode: number;
    timestamp: string;
}

export const resumeService = {
    /**
     * Get user's resume with latest version
     */
    async getResume(): Promise<ResumeResponse> {
        const response = await apiClient.get<ApiResponse<ResumeResponse>>('/resume');
        return response.data.data;
    },

    /**
     * Save a new version of the resume
     */
    async saveVersion(payload: CreateVersionPayload): Promise<ResumeVersionFull> {
        const response = await apiClient.post<ApiResponse<ResumeVersionFull>>('/resume/version', payload);
        return response.data.data;
    },

    /**
     * Get all versions for the resume
     */
    async getVersions(): Promise<ResumeVersionSummary[]> {
        const response = await apiClient.get<ApiResponse<ResumeVersionSummary[]>>('/resume/versions');
        return response.data.data;
    },

    /**
     * Get a specific version by version number
     */
    async getVersion(versionNumber: number): Promise<ResumeVersionFull> {
        const response = await apiClient.get<ApiResponse<ResumeVersionFull>>(`/resume/version/${versionNumber}`);
        return response.data.data;
    },

    /**
     * Delete the latest version (stack behavior)
     */
    async deleteLatestVersion(): Promise<{ deleted: boolean; newLatestVersionNumber?: number }> {
        const response = await apiClient.delete<ApiResponse<{ deleted: boolean; newLatestVersionNumber?: number }>>('/resume/version/latest');
        return response.data.data;
    },
};
