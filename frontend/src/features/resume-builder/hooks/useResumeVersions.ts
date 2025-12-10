/**
 * Hook for resume version management
 * Handles fetching versions, saving, and restoring
 */

import { useState, useCallback, useEffect } from 'react';
import { resumeService } from '@/services/api/resume.service';
import type { ResumeVersionSummary } from '@/services/api/resume.service';
import { useResumeStore } from './useResumeStore';
import { toast } from 'sonner';
import type { ResumeContent, ResumeDesign } from '../types/schema';

interface UseResumeVersionsResult {
    // Version list
    versions: ResumeVersionSummary[];
    isLoadingVersions: boolean;
    refreshVersions: () => Promise<void>;

    // Save
    saveVersion: () => Promise<boolean>;
    isSaving: boolean;

    // Restore
    restoreVersion: (versionNumber: number) => Promise<boolean>;
    isRestoring: boolean;

    // Delete
    deleteLatestVersion: () => Promise<boolean>;
    isDeleting: boolean;

    // Version info
    latestVersionNumber: number;
    activeVersionNumber: number; // Currently displayed version
}

export function useResumeVersions(): UseResumeVersionsResult {
    const [versions, setVersions] = useState<ResumeVersionSummary[]>([]);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [latestVersionNumber, setLatestVersionNumber] = useState(0);
    const [activeVersionNumber, setActiveVersionNumber] = useState(0);

    // Get store methods
    const setDraft = useResumeStore(state => state.setDraft);
    const commit = useResumeStore(state => state.commit);
    const draft = useResumeStore(state => state.draft);

    // Fetch versions
    const refreshVersions = useCallback(async () => {
        setIsLoadingVersions(true);
        try {
            const fetchedVersions = await resumeService.getVersions();
            // Ensure we always have an array
            const versionsArray = Array.isArray(fetchedVersions) ? fetchedVersions : [];
            setVersions(versionsArray);
            if (versionsArray.length > 0) {
                setLatestVersionNumber(versionsArray[0].versionNumber);
            }
        } catch (error) {
            console.error('[useResumeVersions] Failed to fetch versions:', error);
            setVersions([]); // Reset to empty array on error
        } finally {
            setIsLoadingVersions(false);
        }
    }, []);

    // Save current state as new version
    const saveVersion = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            const version = await resumeService.saveVersion({
                contentJSON: draft.content,
                designJSON: draft.design,
                templateId: draft.design.layout || 'single',
            });

            const versionNum = version?.versionNumber ?? latestVersionNumber + 1;
            setLatestVersionNumber(versionNum);
            setActiveVersionNumber(versionNum); // New save becomes active version
            toast.success(`Version ${versionNum} saved`);

            // Refresh versions list
            await refreshVersions();

            return true;
        } catch (error) {
            console.error('[useResumeVersions] Failed to save version:', error);
            toast.error('Failed to save version');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [draft, refreshVersions, latestVersionNumber]);

    // Restore a specific version
    const restoreVersion = useCallback(async (versionNumber: number): Promise<boolean> => {
        setIsRestoring(true);
        try {
            const version = await resumeService.getVersion(versionNumber);

            // Apply to store - this restores the exact state
            setDraft(() => ({
                content: version.contentJSON as ResumeContent,
                design: version.designJSON as ResumeDesign,
            }));

            // Commit to sync with committed state
            commit();

            // Update active version to the restored one
            setActiveVersionNumber(versionNumber);

            toast.success(`Restored to version ${versionNumber}`);
            return true;
        } catch (error) {
            console.error('[useResumeVersions] Failed to restore version:', error);
            toast.error('Failed to restore version');
            return false;
        } finally {
            setIsRestoring(false);
        }
    }, [setDraft, commit]);

    // Delete the latest version (stack behavior)
    const deleteLatestVersion = useCallback(async (): Promise<boolean> => {
        if (versions.length === 0) {
            toast.error('No versions to delete');
            return false;
        }

        setIsDeleting(true);
        try {
            const result = await resumeService.deleteLatestVersion();

            if (result.deleted) {
                const newLatest = result.newLatestVersionNumber ?? 0;
                setLatestVersionNumber(newLatest);

                // If active version was deleted, update to new latest
                if (activeVersionNumber === latestVersionNumber) {
                    setActiveVersionNumber(newLatest);
                }

                toast.success('Version deleted');
                await refreshVersions();
                return true;
            } else {
                toast.error('No versions to delete');
                return false;
            }
        } catch (error) {
            console.error('[useResumeVersions] Failed to delete version:', error);
            toast.error('Failed to delete version');
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [versions.length, latestVersionNumber, activeVersionNumber, refreshVersions]);

    // Load versions on mount
    useEffect(() => {
        refreshVersions();
    }, [refreshVersions]);

    return {
        versions,
        isLoadingVersions,
        refreshVersions,
        saveVersion,
        isSaving,
        restoreVersion,
        isRestoring,
        deleteLatestVersion,
        isDeleting,
        latestVersionNumber,
        activeVersionNumber,
    };
}
