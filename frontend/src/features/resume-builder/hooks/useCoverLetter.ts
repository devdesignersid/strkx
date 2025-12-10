/**
 * Hook for AI-powered cover letter generation
 */

import { useState, useCallback } from 'react';
import { CoverLetterService } from '../services/coverLetterService';
import { useDraft } from './useResumeStore';
import type { CoverLetterResult } from '../types/schema';

interface UseCoverLetterResult {
    generateCoverLetter: (jobDescription: string) => Promise<CoverLetterResult | null>;
    isLoading: boolean;
    error: string | null;
    result: CoverLetterResult | null;
    clearResult: () => void;
    clearError: () => void;
}

export function useCoverLetter(): UseCoverLetterResult {
    const draft = useDraft();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CoverLetterResult | null>(null);

    const generateCoverLetter = useCallback(async (jobDescription: string): Promise<CoverLetterResult | null> => {
        setError(null);
        setIsLoading(true);

        try {
            const coverLetterResult = await CoverLetterService.generate(draft, jobDescription);
            setResult(coverLetterResult);
            return coverLetterResult;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to generate cover letter';
            setError(message);
            console.error('[useCoverLetter] Error:', e);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [draft]);

    const clearResult = useCallback(() => setResult(null), []);
    const clearError = useCallback(() => setError(null), []);

    return {
        generateCoverLetter,
        isLoading,
        error,
        result,
        clearResult,
        clearError,
    };
}
