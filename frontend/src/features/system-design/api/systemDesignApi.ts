import axios from 'axios';
import { API_URL } from '@/config';
import type { SystemDesignProblem } from '@/types/system-design';

const BASE_URL = `${API_URL}/system-design`;

export const systemDesignApi = {
    // Problems
    getAllProblems: async () => {
        const response = await axios.get(`${BASE_URL}/problems`, { withCredentials: true });
        return response.data.data;
    },

    getProblem: async (id: string): Promise<SystemDesignProblem> => {
        const response = await axios.get(`${BASE_URL}/problems/${id}`, { withCredentials: true });
        return response.data.data;
    },

    createProblem: async (data: Partial<SystemDesignProblem>) => {
        const response = await axios.post(`${BASE_URL}/problems`, data, { withCredentials: true });
        return response.data.data;
    },

    updateProblem: async (id: string, data: Partial<SystemDesignProblem>) => {
        const response = await axios.post(`${BASE_URL}/problems/${id}`, data, { withCredentials: true });
        return response.data.data;
    },

    deleteProblem: async (id: string) => {
        const response = await axios.post(`${BASE_URL}/problems/${id}/delete`, {}, { withCredentials: true });
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
        const response = await axios.post(`${BASE_URL}/submissions`, data, { withCredentials: true });
        return response.data.data;
    },

    updateSubmission: async (id: string, data: {
        excalidrawJson?: any;
        notesMarkdown?: string;
        timeSpentSeconds?: number;
        status?: string;
        aiAnalysis?: any;
    }) => {
        const response = await axios.post(`${BASE_URL}/submissions/${id}`, data, { withCredentials: true });
        return response.data.data;
    },

    getUserSubmissions: async (problemId: string) => {
        const response = await axios.get(`${BASE_URL}/problems/${problemId}/submissions`, { withCredentials: true });
        return response.data.data;
    },

    getSubmission: async (id: string) => {
        const response = await axios.get(`${BASE_URL}/submissions/${id}`, { withCredentials: true });
        return response.data.data;
    },

    // AI Analysis
    analyzeSubmission: async (submissionId: string) => {
        const response = await axios.post(`${BASE_URL}/submissions/${submissionId}/analyze`, {}, { withCredentials: true });
        return response.data.data;
    },

    // Mark as solution
    markAsSolution: async (submissionId: string, name?: string) => {
        const response = await axios.post(`${BASE_URL}/submissions/${submissionId}/mark-solution`, { solutionName: name }, { withCredentials: true });
        return response.data.data;
    },
};
