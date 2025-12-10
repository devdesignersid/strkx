export interface ResumeProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
}

export interface ResumeExperience {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    location: string;
    description: string; // We will treat this as newline-separated bullets
}

// Simplified Education
export interface ResumeEducation {
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationYear?: string; // Optional per reference guide
    description?: string;
    // Legacy fields for backward compat if needed, but UI will focus on graduationYear
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    location?: string;
}

// New Skill Categories
export interface SkillCategory {
    id: string;
    name: string;
    skills: string[];
}

export interface ResumeSkill { // Legacy support during migration
    id: string;
    name: string;
    level?: number;
}

export interface ResumeAward {
    id: string;
    title: string;
    issuer: string;
    date: string;
    description?: string;
}

export interface ResumeContent {
    profile: ResumeProfile;
    summary: string;
    experience: ResumeExperience[];
    education: ResumeEducation[];
    skillCategories: SkillCategory[]; // New standard
    skills: ResumeSkill[]; // Kept for backward compat/migration
    awards: ResumeAward[]; // New
}

export interface ResumeDesign {
    fontBody: string;
    fontHeading: string;     // NEW
    headingColor: string;    // NEW
    bodyColor: string;       // NEW
    lineHeight: number;
    margin: number; // in points
    accentColor: string;
    layout: 'single' | 'sidebar';
}

export interface ResumeData {
    content: ResumeContent;
    design: ResumeDesign;
}

// AI Resume Analyzer types
export interface ResumeAnalysisResult {
    contentFindings: string[];
    designFindings: string[];
    atsFindings: string[];
    priorityIssues: string[];
    recommendedImprovements: {
        content: string[];
        design: string[];
        ats: string[];
    };
}

// AI LinkedIn Optimizer types
export interface LinkedInWorkHistory {
    jobTitle: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
}

export interface LinkedInProfileResult {
    headline: string;
    about: {
        summary: string;
        skills: string[];
    };
    workHistory: LinkedInWorkHistory[];
}
