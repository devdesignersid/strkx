/**
 * Hook for AI-powered resume analysis
 */

import { useState, useCallback } from 'react';
import { ResumeAnalysisService } from '../services/resumeAnalysisService';
import { useDraft } from './useResumeStore';
import type { ResumeAnalysisResult } from '../types/schema';

interface UseResumeAnalysisResult {
    analyzeResume: () => Promise<ResumeAnalysisResult | null>;
    isLoading: boolean;
    error: string | null;
    result: ResumeAnalysisResult | null;
    clearResult: () => void;
    clearError: () => void;
}

export function useResumeAnalysis(): UseResumeAnalysisResult {
    const draft = useDraft();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResumeAnalysisResult | null>(null);

    const analyzeResume = useCallback(async (): Promise<ResumeAnalysisResult | null> => {
        setError(null);
        setIsLoading(true);

        try {
            const analysisResult = await ResumeAnalysisService.analyze(draft);
            setResult(analysisResult);
            return analysisResult;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to analyze resume';
            setError(message);
            console.error('[useResumeAnalysis] Error:', e);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [draft]);

    const clearResult = useCallback(() => setResult(null), []);
    const clearError = useCallback(() => setError(null), []);

    return {
        analyzeResume,
        isLoading,
        error,
        result,
        clearResult,
        clearError,
    };
}
