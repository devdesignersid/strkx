import type { ResumeData, ResumeContent, ResumeDesign } from '../types/schema';

// Initial defaults to fall back on
const DEFAULT_CONTENT: ResumeContent = {
    profile: {
        name: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        github: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [], // Legacy
    skillCategories: [],
    awards: [],
};

const DEFAULT_DESIGN: ResumeDesign = {
    fontBody: 'Source Sans Pro',
    fontHeading: 'Source Sans Pro',
    bodyColor: '#2d2d2d',
    headingColor: '#1a1a1a',
    lineHeight: 1.32,
    margin: 28,
    accentColor: '#1a1a1a',
    layout: 'single',
};

const DESIGN_BOUNDS = {
    lineHeight: { min: 1.0, max: 2.0 },
    margin: { min: 14, max: 72 },
};

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value || min));

/**
 * Validates and sanitizes resume data to ensure type safety and completeness.
 * Deep merges input with defaults to fill missing fields.
 */
export const validateAndSanitize = (contentInput: any, designInput: any): ResumeData => {
    // 1. Sanitize Content
    const c = contentInput || {};
    const sanitizedContent: ResumeContent = {
        profile: {
            name: c.profile?.name || '',
            email: c.profile?.email || '',
            phone: c.profile?.phone || '',
            location: c.profile?.location || '',
            website: c.profile?.website || '',
            linkedin: c.profile?.linkedin || '',
            github: c.profile?.github || '',
        },
        summary: c.summary || '',
        // Ensure arrays are arrays
        experience: Array.isArray(c.experience) ? c.experience : [],
        education: Array.isArray(c.education) ? c.education : [],
        skillCategories: Array.isArray(c.skillCategories) ? c.skillCategories : [],
        skills: Array.isArray(c.skills) ? c.skills : [],
        awards: Array.isArray(c.awards) ? c.awards : [],
    };

    // 2. Sanitize Design
    const d = designInput || {};
    const sanitizedDesign: ResumeDesign = {
        fontBody: d.fontBody || DEFAULT_DESIGN.fontBody,
        fontHeading: d.fontHeading || d.fontBody || DEFAULT_DESIGN.fontHeading, // Fallback to body font if missing
        bodyColor: d.bodyColor || DEFAULT_DESIGN.bodyColor,
        headingColor: d.headingColor || DEFAULT_DESIGN.headingColor,
        accentColor: d.accentColor || DEFAULT_DESIGN.accentColor,
        layout: (d.layout === 'single' || d.layout === 'sidebar') ? d.layout : DEFAULT_DESIGN.layout,
        // Number validation
        lineHeight: clamp(Number(d.lineHeight), DESIGN_BOUNDS.lineHeight.min, DESIGN_BOUNDS.lineHeight.max),
        margin: clamp(Number(d.margin), DESIGN_BOUNDS.margin.min, DESIGN_BOUNDS.margin.max),
    };

    return {
        content: sanitizedContent,
        design: sanitizedDesign,
    };
};
