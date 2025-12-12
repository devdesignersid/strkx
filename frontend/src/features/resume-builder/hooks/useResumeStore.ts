import { create } from 'zustand';
import { temporal } from 'zundo';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { get, set, del } from 'idb-keyval';
import type { ResumeData, ResumeProfile, ResumeExperience, ResumeEducation, SkillCategory, ResumeAward, ResumeDesign } from '../types/schema';

// Initial / Default State
const initialData: ResumeData = {
    content: {
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
        skills: [],
        skillCategories: [], // New default
        awards: [],
    },
    design: {
        fontBody: 'Source Sans Pro',
        fontHeading: 'Source Sans Pro',
        bodyColor: '#2d2d2d',
        headingColor: '#1a1a1a',
        lineHeight: 1.32,
        margin: 28, // ~0.4 inch in pt
        accentColor: '#1a1a1a', // Professional dark
        layout: 'single',
    },
};

// IDB Storage Adapter
const idbStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const value = await get(name);
        return value || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

interface ResumeStore {
    draft: ResumeData;
    committed: ResumeData;
    activeVersionNumber: number;

    // Actions
    setDraft: (updater: (draft: ResumeData) => ResumeData) => void;
    setActiveVersionNumber: (version: number) => void;
    commit: () => void;
}

// Design bounds for validation
const DESIGN_BOUNDS = {
    lineHeight: { min: 1.0, max: 2.0 },
    margin: { min: 14, max: 72 }, // 0.2 to 1 inch in pt
};

// Clamp a value within bounds
const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

// Validate and sanitize design values
const validateDesign = (design: ResumeDesign): ResumeDesign => ({
    ...design,
    lineHeight: clamp(design.lineHeight, DESIGN_BOUNDS.lineHeight.min, DESIGN_BOUNDS.lineHeight.max),
    margin: clamp(design.margin, DESIGN_BOUNDS.margin.min, DESIGN_BOUNDS.margin.max),
    fontBody: design.fontBody || 'Source Sans Pro',
    fontHeading: design.fontHeading || 'Source Sans Pro',
    bodyColor: design.bodyColor || '#2d2d2d',
    headingColor: design.headingColor || '#1a1a1a',
    accentColor: design.accentColor || '#1a1a1a',
    layout: design.layout || 'single',
});

export const useResumeStore = create<ResumeStore>()(
    temporal(
        persist(
            (set) => ({
                draft: initialData,
                committed: initialData,

                activeVersionNumber: 0,

                setDraft: (updater) => {
                    set((state) => {
                        const newDraft = updater(state.draft);
                        // Validate design bounds
                        return {
                            draft: {
                                ...newDraft,
                                design: validateDesign(newDraft.design),
                            }
                        };
                    });
                },

                setActiveVersionNumber: (version: number) => {
                    set({ activeVersionNumber: version });
                },

                commit: () => {
                    set((state) => ({ committed: state.draft }));
                },
            }),
            {
                name: 'strkx-resume-storage',
                storage: createJSONStorage(() => idbStorage),
                partialize: (state) => ({
                    draft: state.draft,
                    committed: state.committed,
                    activeVersionNumber: state.activeVersionNumber // Persist active version
                }),
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        // Migrate Design
                        if (!state.draft.design.fontHeading) {
                            state.draft.design.fontHeading = state.draft.design.fontBody;
                            state.draft.design.headingColor = state.draft.design.accentColor;
                            state.draft.design.bodyColor = '#374151';
                            // Ensure dark accent default if it was black
                            if (state.draft.design.accentColor === '#000000') {
                                state.draft.design.accentColor = '#111827';
                            }
                        }

                        // Migrate Skills
                        if ((!state.draft.content.skillCategories || state.draft.content.skillCategories.length === 0)
                            && state.draft.content.skills && state.draft.content.skills.length > 0) {
                            state.draft.content.skillCategories = [{
                                id: 'tech-stack',
                                name: 'Technical Skills',
                                skills: state.draft.content.skills.map(s => s.name)
                            }];
                        } else if (!state.draft.content.skillCategories) {
                            state.draft.content.skillCategories = [];
                        }

                        // Migrate Awards
                        if (!state.draft.content.awards) {
                            state.draft.content.awards = [];
                        }
                    }
                }
            }
        ),
        {
            limit: 100, // Undo history limit
            partialize: (state) => ({ draft: state.draft }), // Only track draft changes in undo history
            equality: (a, b) => JSON.stringify(a) === JSON.stringify(b), // Simple equality (should be optimized in prod)
        }
    )
);

// ============================================================================
// GRANULAR SELECTORS - Prevent unnecessary re-renders
// ============================================================================

// Profile selectors
export const useProfile = (): ResumeProfile => useResumeStore(state => state.draft.content.profile);
export const useSummary = (): string => useResumeStore(state => state.draft.content.summary);

// Content array selectors (with shallow comparison for arrays)
export const useExperience = (): ResumeExperience[] => useResumeStore(useShallow(state => state.draft.content.experience));
export const useEducation = (): ResumeEducation[] => useResumeStore(useShallow(state => state.draft.content.education));
export const useSkillCategories = (): SkillCategory[] => useResumeStore(useShallow(state => state.draft.content.skillCategories));
export const useAwards = (): ResumeAward[] => useResumeStore(useShallow(state => state.draft.content.awards));

// Design selectors
export const useDesign = (): ResumeDesign => useResumeStore(useShallow(state => state.draft.design));
export const useFonts = () => useResumeStore(useShallow(state => ({
    fontBody: state.draft.design.fontBody,
    fontHeading: state.draft.design.fontHeading,
})));

// Action selectors (stable references)
export const useSetDraft = () => useResumeStore(state => state.setDraft);
export const useCommit = () => useResumeStore(state => state.commit);

// Full draft for PDF preview (still needed for complete render)
export const useDraft = (): ResumeData => useResumeStore(state => state.draft);

