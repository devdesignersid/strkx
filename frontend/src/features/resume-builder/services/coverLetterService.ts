/**
 * Cover Letter Generation Service
 * Uses AI to generate personalized cover letters from resume data + job description
 */

import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import type { ResumeData, CoverLetterResult } from '../types/schema';

/**
 * Compress resume data for efficient token usage
 */
function compressResumeData(data: ResumeData): string {
    const { content } = data;

    const compressed: Record<string, unknown> = {
        name: content.profile.name,
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
            description: exp.description,
        }));
    }

    if (content.skillCategories?.length > 0) {
        compressed.skills = content.skillCategories.flatMap(cat => cat.skills);
    }

    if (content.education?.length > 0) {
        compressed.education = content.education.map(edu => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
        }));
    }

    return JSON.stringify(compressed, null, 2);
}

/**
 * Parse AI response into structured cover letter
 */
function parseCoverLetterResponse(response: string): CoverLetterResult {
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(jsonStr) as CoverLetterResult;

        if (!parsed.coverLetter || typeof parsed.coverLetter !== 'object') {
            throw new Error('Invalid response: missing coverLetter object');
        }

        const cl = parsed.coverLetter;
        return {
            coverLetter: {
                greeting: cl.greeting || 'Dear Hiring Team,',
                opening: cl.opening || '',
                excitement: cl.excitement || '',
                connectionStory: cl.connectionStory || '',
                professionalAlignment: cl.professionalAlignment || '',
                closing: cl.closing || '',
                signature: cl.signature || '',
            },
        };
    } catch (e) {
        console.error('[CoverLetterService] Failed to parse response:', e);
        throw new Error('Failed to parse AI cover letter response');
    }
}

export const CoverLetterService = {
    /**
     * Generate cover letter from resume and job description
     */
    async generate(resumeData: ResumeData, jobDescription: string): Promise<CoverLetterResult> {
        if (!aiService.isConfigured()) {
            throw new Error('AI service not configured. Please configure AI in Settings.');
        }

        if (!jobDescription?.trim()) {
            throw new Error('Please provide a job description to generate a tailored cover letter.');
        }

        const compressed = compressResumeData(resumeData);
        const prompt = PROMPTS.COVER_LETTER_GENERATION
            .replace('{resumeData}', compressed)
            .replace('{jobDescription}', jobDescription);

        const response = await aiService.generateCompletion(prompt);
        return parseCoverLetterResponse(response);
    },
};
