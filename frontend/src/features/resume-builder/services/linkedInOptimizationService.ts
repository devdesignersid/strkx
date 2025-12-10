/**
 * LinkedIn Profile Optimization Service
 * Uses AI to generate optimized LinkedIn content from resume data
 */

import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import type { ResumeData, LinkedInProfileResult } from '../types/schema';

/**
 * Compress resume data to minimal JSON for efficient token usage
 */
function compressResumeData(data: ResumeData): string {
    const { content } = data;

    const compressed: Record<string, unknown> = {
        profile: content.profile,
    };

    if (content.summary?.trim()) {
        compressed.summary = content.summary;
    }

    if (content.experience?.length > 0) {
        compressed.experience = content.experience.map(exp => ({
            company: exp.company,
            position: exp.position,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent,
            description: exp.description,
        }));
    }

    if (content.education?.length > 0) {
        compressed.education = content.education.map(edu => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            graduationYear: edu.graduationYear,
        }));
    }

    if (content.skillCategories?.length > 0) {
        compressed.skillCategories = content.skillCategories.map(cat => ({
            name: cat.name,
            skills: cat.skills,
        }));
    }

    return JSON.stringify(compressed, null, 2);
}

/**
 * Parse AI response into structured LinkedIn profile
 */
function parseLinkedInResponse(response: string): LinkedInProfileResult {
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(jsonStr) as LinkedInProfileResult;

        // Validate structure
        if (!parsed.headline || typeof parsed.headline !== 'string') {
            throw new Error('Invalid response: missing headline');
        }

        if (!parsed.about || typeof parsed.about !== 'object') {
            throw new Error('Invalid response: missing about section');
        }

        // Return with defaults for missing fields
        return {
            headline: parsed.headline,
            about: {
                summary: parsed.about.summary || '',
                skills: Array.isArray(parsed.about.skills) ? parsed.about.skills : [],
            },
            workHistory: Array.isArray(parsed.workHistory)
                ? parsed.workHistory.map(job => ({
                    jobTitle: job.jobTitle || '',
                    company: job.company || '',
                    location: job.location || '',
                    dates: job.dates || '',
                    bullets: Array.isArray(job.bullets) ? job.bullets : [],
                }))
                : [],
        };
    } catch (e) {
        console.error('[LinkedInOptimization] Failed to parse response:', e);
        throw new Error('Failed to parse AI LinkedIn optimization response');
    }
}

export const LinkedInOptimizationService = {
    /**
     * Generate optimized LinkedIn profile from resume
     */
    async optimize(resumeData: ResumeData): Promise<LinkedInProfileResult> {
        if (!aiService.isConfigured()) {
            throw new Error('AI service not configured. Please configure AI in Settings.');
        }

        const compressed = compressResumeData(resumeData);
        const prompt = PROMPTS.LINKEDIN_OPTIMIZATION.replace('{resumeData}', compressed);
        const response = await aiService.generateCompletion(prompt);

        return parseLinkedInResponse(response);
    },
};
