/**
 * Hook for AI-powered skill extraction from resume Work Experience
 */

import { useState, useCallback } from 'react';
import { SkillExtractionService, skillsToCategories, type ExtractedSkills } from '../services/skillExtractionService';
import { useExperience } from './useResumeStore';
import type { SkillCategory } from '../types/schema';

interface UseSkillExtractionResult {
    extractSkills: () => Promise<SkillCategory[] | null>;
    isLoading: boolean;
    error: string | null;
    lastExtracted: ExtractedSkills | null;
    clearError: () => void;
}

// Simple in-memory cache
let cachedResult: { experienceHash: string; skills: ExtractedSkills } | null = null;

function hashExperiences(experiences: { id: string; description: string }[]): string {
    return experiences.map(e => `${e.id}:${e.description}`).join('|');
}

export function useSkillExtraction(): UseSkillExtractionResult {
    const experience = useExperience() || [];
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastExtracted, setLastExtracted] = useState<ExtractedSkills | null>(null);

    const extractSkills = useCallback(async (): Promise<SkillCategory[] | null> => {
        setError(null);

        // Check cache
        const currentHash = hashExperiences(experience);
        if (cachedResult && cachedResult.experienceHash === currentHash) {
            setLastExtracted(cachedResult.skills);
            return skillsToCategories(cachedResult.skills);
        }

        setIsLoading(true);

        try {
            const skills = await SkillExtractionService.extract(experience);

            // Cache result
            cachedResult = { experienceHash: currentHash, skills };
            setLastExtracted(skills);

            return skillsToCategories(skills);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to extract skills';
            setError(message);
            console.error('[useSkillExtraction] Error:', e);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [experience]);

    const clearError = useCallback(() => setError(null), []);

    return {
        extractSkills,
        isLoading,
        error,
        lastExtracted,
        clearError,
    };
}
