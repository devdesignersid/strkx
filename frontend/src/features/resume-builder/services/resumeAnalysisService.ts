/**
 * Resume Analysis Service
 * Uses AI to analyze resume content and provide actionable recommendations
 */

import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import type { ResumeData, ResumeAnalysisResult } from '../types/schema';

interface AnalysisResponse {
    analysis: ResumeAnalysisResult;
}

/**
 * Compress resume data to minimal JSON for efficient token usage
 */
function compressResumeData(data: ResumeData): string {
    const { content, design } = data;

    // Only include non-empty content
    const compressed: Record<string, unknown> = {
        profile: content.profile,
        design: {
            fontBody: design.fontBody,
            layout: design.layout,
            margin: design.margin,
        },
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

    if (content.awards?.length > 0) {
        compressed.awards = content.awards;
    }

    return JSON.stringify(compressed, null, 2);
}

/**
 * Parse AI response into structured analysis
 */
function parseAnalysisResponse(response: string): ResumeAnalysisResult {
    // Try to extract JSON from response
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(jsonStr) as AnalysisResponse;

        // Validate structure
        if (!parsed.analysis || typeof parsed.analysis !== 'object') {
            throw new Error('Invalid response structure: missing analysis object');
        }

        const { analysis } = parsed;

        // Return with defaults for missing fields
        return {
            contentFindings: Array.isArray(analysis.contentFindings) ? analysis.contentFindings : [],
            designFindings: Array.isArray(analysis.designFindings) ? analysis.designFindings : [],
            atsFindings: Array.isArray(analysis.atsFindings) ? analysis.atsFindings : [],
            priorityIssues: Array.isArray(analysis.priorityIssues) ? analysis.priorityIssues : [],
            recommendedImprovements: {
                content: Array.isArray(analysis.recommendedImprovements?.content)
                    ? analysis.recommendedImprovements.content : [],
                design: Array.isArray(analysis.recommendedImprovements?.design)
                    ? analysis.recommendedImprovements.design : [],
                ats: Array.isArray(analysis.recommendedImprovements?.ats)
                    ? analysis.recommendedImprovements.ats : [],
            },
        };
    } catch (e) {
        console.error('[ResumeAnalysis] Failed to parse response:', e);
        throw new Error('Failed to parse AI analysis response');
    }
}

export const ResumeAnalysisService = {
    /**
     * Analyze resume using AI
     */
    async analyze(resumeData: ResumeData): Promise<ResumeAnalysisResult> {
        // Validate we have AI configured
        if (!aiService.isConfigured()) {
            throw new Error('AI service not configured. Please configure AI in Settings.');
        }

        // Compress resume data
        const compressed = compressResumeData(resumeData);

        // Build prompt
        const prompt = PROMPTS.RESUME_ANALYSIS.replace('{resumeData}', compressed);

        // Call AI
        const response = await aiService.generateCompletion(prompt);

        // Parse and return
        return parseAnalysisResponse(response);
    },
};
