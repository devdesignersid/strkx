/**
 * Hook for AI-powered LinkedIn profile optimization
 */

import { useState, useCallback } from 'react';
import { LinkedInOptimizationService } from '../services/linkedInOptimizationService';
import { useDraft } from './useResumeStore';
import type { LinkedInProfileResult } from '../types/schema';

interface UseLinkedInOptimizationResult {
    optimizeLinkedIn: () => Promise<LinkedInProfileResult | null>;
    isLoading: boolean;
    error: string | null;
    result: LinkedInProfileResult | null;
    clearResult: () => void;
    clearError: () => void;
}

export function useLinkedInOptimization(): UseLinkedInOptimizationResult {
    const draft = useDraft();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LinkedInProfileResult | null>(null);

    const optimizeLinkedIn = useCallback(async (): Promise<LinkedInProfileResult | null> => {
        setError(null);
        setIsLoading(true);

        try {
            const optimizationResult = await LinkedInOptimizationService.optimize(draft);
            setResult(optimizationResult);
            return optimizationResult;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to optimize LinkedIn profile';
            setError(message);
            console.error('[useLinkedInOptimization] Error:', e);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [draft]);

    const clearResult = useCallback(() => setResult(null), []);
    const clearError = useCallback(() => setError(null), []);

    return {
        optimizeLinkedIn,
        isLoading,
        error,
        result,
        clearResult,
        clearError,
    };
}
