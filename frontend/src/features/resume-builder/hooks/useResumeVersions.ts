/**
 * Hook for resume version management
 * Handles fetching versions, saving, and restoring
 */

import { useState, useCallback, useEffect } from 'react';
import { resumeService } from '@/services/api/resume.service';
import type { ResumeVersionSummary } from '@/services/api/resume.service';
import { useResumeStore } from './useResumeStore';
import { toast } from 'sonner';

import { validateAndSanitize } from '../utils/resumeValidator';

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

    // Get store methods and state
    const setDraft = useResumeStore(state => state.setDraft);
    const commit = useResumeStore(state => state.commit);
    const draft = useResumeStore(state => state.draft);
    const activeVersionNumber = useResumeStore(state => state.activeVersionNumber);
    const setActiveVersionNumber = useResumeStore(state => state.setActiveVersionNumber);

    // Track hydration status
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        // Check if already hydrated
        if (useResumeStore.persist.hasHydrated()) {
            setHasHydrated(true);
        } else {
            // Listen for hydration
            const unsub = useResumeStore.persist.onFinishHydration(() => {
                setHasHydrated(true);
            });
            return () => {
                // Determine if unsub is a function (Zustand version compat)
                if (typeof unsub === 'function') unsub();
            };
        }
    }, []);

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

                // Only set active version if:
                // 1. Storage has finished rehydrating (so we know if we have a persisted value)
                // 2. The current active version is 0 (meaning no persisted value found)
                if (hasHydrated && activeVersionNumber === 0) {
                    setActiveVersionNumber(versionsArray[0].versionNumber);
                }
            }
        } catch (error) {
            console.error('[useResumeVersions] Failed to fetch versions:', error);
            setVersions([]); // Reset to empty array on error
        } finally {
            setIsLoadingVersions(false);
        }
    }, [activeVersionNumber, setActiveVersionNumber, hasHydrated]);

    // Save current state as new version
    const saveVersion = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            const version = await resumeService.saveVersion({
                contentJSON: draft.content,
                designJSON: draft.design,
                templateId: draft.design.layout || 'single',
            });

            // Sync committed state to match draft (for hasChanges tracking)
            commit();

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
    }, [draft, refreshVersions, latestVersionNumber, commit]);

    // Restore a specific version
    const restoreVersion = useCallback(async (versionNumber: number): Promise<boolean> => {
        setIsRestoring(true);
        try {
            const version = await resumeService.getVersion(versionNumber);

            // 1. Validate and Sanitize
            const { content, design } = validateAndSanitize(version.contentJSON, version.designJSON);

            // 2. Atomic Update (Zundo will capture this as one step)
            setDraft(() => ({
                content,
                design,
            }));

            // 3. Sync Committed State
            commit();

            // 4. Update UI State
            setActiveVersionNumber(versionNumber);

            // 5. Success Feedback & Telemetry
            toast.success(`Restored to version ${versionNumber}`);
            console.info('[Telemetry] RESTORE_VERSION_SUCCESS', {
                versionNumber,
                timestamp: new Date().toISOString(),
                hasContent: Boolean(content),
                hasDesign: Boolean(design)
            });

            return true;
        } catch (error) {
            console.error('[useResumeVersions] Failed to restore version:', error);

            console.info('[Telemetry] RESTORE_VERSION_ERROR', {
                versionNumber,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });

            toast.error('Failed to restore version. Data might be corrupted.');
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
    }, [versions.length, latestVersionNumber, activeVersionNumber, setActiveVersionNumber, refreshVersions]);

    // Load versions on mount or when hydration finishes
    useEffect(() => {
        refreshVersions();
    }, [refreshVersions, hasHydrated]);

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
