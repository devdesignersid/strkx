import { apiClient } from './client';
import type { SystemDesignProblem } from '@/types/system-design';

const BASE_URL = '/system-design';

export const systemDesignApi = {
    // Problems
    getAllProblems: async () => {
        const response = await apiClient.get(`${BASE_URL}/problems`);
        return response.data.data;
    },

    getProblem: async (id: string): Promise<SystemDesignProblem> => {
        const response = await apiClient.get(`${BASE_URL}/problems/${id}`);
        return response.data.data;
    },

    createProblem: async (data: Partial<SystemDesignProblem>) => {
        const response = await apiClient.post(`${BASE_URL}/problems`, data);
        return response.data.data;
    },

    updateProblem: async (id: string, data: Partial<SystemDesignProblem>) => {
        const response = await apiClient.post(`${BASE_URL}/problems/${id}`, data);
        return response.data.data;
    },

    deleteProblem: async (id: string) => {
        const response = await apiClient.post(`${BASE_URL}/problems/${id}/delete`, {});
        return response.data.data;
    },

    // Submissions
    createSubmission: async (data: {
        problemId: string;
        excalidrawJson: any;
        notesMarkdown?: string;
        timeSpentSeconds?: number;
        status?: string;
    }) => {
        const response = await apiClient.post(`${BASE_URL}/submissions`, data);
        return response.data.data;
    },

    updateSubmission: async (id: string, data: {
        excalidrawJson?: any;
        notesMarkdown?: string;
        timeSpentSeconds?: number;
        status?: string;
        aiAnalysis?: any;
    }) => {
        const response = await apiClient.post(`${BASE_URL}/submissions/${id}`, data);
        return response.data.data;
    },

    getUserSubmissions: async (problemId: string) => {
        const response = await apiClient.get(`${BASE_URL}/problems/${problemId}/submissions`);
        return response.data.data;
    },

    getSubmission: async (id: string) => {
        const response = await apiClient.get(`${BASE_URL}/submissions/${id}`);
        return response.data.data;
    },

    // AI Analysis
    analyzeSubmission: async (submissionId: string) => {
        const response = await apiClient.post(`${BASE_URL}/submissions/${submissionId}/analyze`, {});
        return response.data.data;
    },

    // Mark as solution
    markAsSolution: async (submissionId: string, name?: string) => {
        const response = await apiClient.post(`${BASE_URL}/submissions/${submissionId}/mark-solution`, { solutionName: name });
        return response.data.data;
    },
};
