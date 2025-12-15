import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SystemDesignProblem } from '@/types/system-design';
import { NOTES_TEMPLATE } from '@/types/system-design';
import { systemDesignApi } from '@/services/api/system-design.service';
import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import { exportToBlob } from '@excalidraw/excalidraw';

export function useSystemDesignProblem(id: string | undefined) {
    const queryClient = useQueryClient();
    const [problem, setProblem] = useState<SystemDesignProblem | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [solutions, _setSolutions] = useState<any[]>([]); // TODO: Fetch solutions

    const [notes, setNotes] = useState(NOTES_TEMPLATE);

    // State for initialization/loading only. 
    // Changing this triggers the canvas to RELOAD (e.g. reset or switch submission).
    const [initialExcalidrawData, setInitialExcalidrawData] = useState<any>(null);

    // Ref for the latest data. Updating this does NOT trigger re-renders.
    // This is used for saving and analysis without performance hits.
    const excalidrawDataRef = useRef<any>(null);

    // Reset key - incrementing this forces ExcalidrawWrapper to re-run its effect
    const [resetKey, setResetKey] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

    const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Helper to update ref without re-render
    const updateExcalidrawData = useCallback((data: any) => {
        excalidrawDataRef.current = data;
    }, []);

    // Fetch problem details
    useEffect(() => {
        if (!id) return;

        const fetchProblem = async () => {
            try {
                const data = await systemDesignApi.getProblem(id);
                setProblem(data);
                if (data.solutions) {
                    _setSolutions(data.solutions);
                }
            } catch (error) {
                console.error('Failed to fetch problem:', error);
                toast.error('Failed to load problem details');
            }
        };

        const fetchSubmissions = async () => {
            try {
                const data = await systemDesignApi.getUserSubmissions(id);
                setSubmissions(data);

                // If there's an in-progress submission, load it
                const inProgress = data.find((s: any) => s.status === 'in_progress');
                if (inProgress) {
                    setCurrentSubmissionId(inProgress.id);
                    if (inProgress.excalidrawJson) {
                        setInitialExcalidrawData(inProgress.excalidrawJson);
                        excalidrawDataRef.current = inProgress.excalidrawJson;
                    }
                    if (inProgress.notesMarkdown) setNotes(inProgress.notesMarkdown);
                    if (inProgress.timeSpentSeconds) setTimeSpentSeconds(inProgress.timeSpentSeconds);
                }
            } catch (error) {
                console.error('Failed to fetch submissions:', error);
            }
        };

        fetchProblem();
        fetchSubmissions();
    }, [id]);



    const handleSave = useCallback(async () => {
        if (!id) return { success: false };
        setIsSaving(true);

        try {
            const data = {
                problemId: id,
                excalidrawJson: excalidrawDataRef.current,
                notesMarkdown: notes,
                timeSpentSeconds,
                status: 'in_progress'
            };

            let result;
            if (currentSubmissionId) {
                result = await systemDesignApi.updateSubmission(currentSubmissionId, data);
            } else {
                result = await systemDesignApi.createSubmission(data);
                setCurrentSubmissionId(result.id);
            }

            setLastSaved(new Date());

            // Refresh submissions list
            const subs = await systemDesignApi.getUserSubmissions(id);
            setSubmissions(subs);

            return { success: true };
        } catch (error) {
            console.error('Failed to save:', error);
            return { success: false };
        } finally {
            setIsSaving(false);
        }
    }, [id, currentSubmissionId, notes, timeSpentSeconds]);

    // Autosave disabled per user request
    // useEffect(() => {
    //     if (!problem || !currentSubmissionId) return;
    //     const timer = setTimeout(() => {
    //         handleSave();
    //     }, 2000);
    //     return () => clearTimeout(timer);
    // }, [excalidrawData, notes, handleSave, problem, currentSubmissionId]);

    const loadSubmission = useCallback((submission: any) => {
        // Always set the data, even if it's null/empty, to avoid stale state from previous submission
        setInitialExcalidrawData(submission.excalidrawJson || null);
        excalidrawDataRef.current = submission.excalidrawJson || null;

        // If notes are present (even empty string), use them. Otherwise fallback to template?
        // Better to just use what's there. If it's undefined, maybe keep current?
        // No, we should probably reset to what's in the submission.
        setNotes(submission.notesMarkdown !== undefined ? submission.notesMarkdown : NOTES_TEMPLATE);

        if (submission.timeSpentSeconds !== undefined) {
            setTimeSpentSeconds(submission.timeSpentSeconds);
        }

        setCurrentSubmissionId(submission.id);
    }, []);

    const resetCanvas = useCallback(() => {
        setInitialExcalidrawData(null);
        excalidrawDataRef.current = null;
        setResetKey(prev => prev + 1);
        setNotes(NOTES_TEMPLATE);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!id) return { success: false };
        setIsSaving(true);

        try {
            const data = {
                problemId: id,
                excalidrawJson: excalidrawDataRef.current,
                notesMarkdown: notes,
                timeSpentSeconds,
                status: 'completed'
            };

            // Always create a new submission on submit (not update)
            await systemDesignApi.createSubmission(data);

            setLastSaved(new Date());

            // Refresh submissions list
            const subs = await systemDesignApi.getUserSubmissions(id);
            setSubmissions(subs);

            // Clear current submission ID so user can start fresh
            setCurrentSubmissionId(null);

            // Reset time spent for next submission
            setTimeSpentSeconds(0);

            // Invalidate the problems list cache so status updates in the listing
            queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });

            return { success: true };
        } catch (error) {
            console.error('Failed to submit:', error);
            return { success: false };
        } finally {
            setIsSaving(false);
        }
    }, [id, notes, timeSpentSeconds]);

    const handleAnalyze = useCallback(async () => {
        if (!currentSubmissionId) {
            toast.error('Please save your design first');
            return;
        }

        if (!aiService.isConfigured()) {
            toast.error('AI is not configured. Please go to Settings.');
            return;
        }

        setIsAnalyzing(true);
        try {
            const currentData = excalidrawDataRef.current;
            // Extract diagram summary
            let diagramSummary = 'No diagram created.';
            if (currentData && currentData.elements && currentData.elements.length > 0) {
                const nodes = currentData.elements.filter((el: any) => !el.isDeleted && el.type !== 'arrow').length;
                const edges = currentData.elements.filter((el: any) => !el.isDeleted && el.type === 'arrow').length;
                const textElements = currentData.elements.filter((el: any) => !el.isDeleted && el.type === 'text').map((el: any) => el.text).join(', ');
                diagramSummary = `Diagram contains ${nodes} nodes and ${edges} connections. Text labels found: ${textElements}`;
            }

            // Generate snapshot for AI analysis
            let base64Image: string | undefined;
            if (currentData && currentData.elements && currentData.elements.length > 0) {
                try {
                    const blob = await exportToBlob({
                        elements: currentData.elements.filter((e: any) => !e.isDeleted),
                        appState: {
                            ...currentData.appState,
                            exportWithDarkMode: true,
                            exportBackground: false,
                        },
                        files: null,
                        mimeType: 'image/png',
                        quality: 0.8,
                    });

                    // Convert blob to base64
                    base64Image = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error('Failed to generate snapshot for AI:', error);
                }
            }

            const prompt = PROMPTS.SYSTEM_DESIGN_ANALYSIS
                .replace('{problemTitle}', problem?.title || 'System Design Problem')
                .replace('{problemDescription}', problem?.description || '')
                .replace('{userNotes}', notes || 'No notes provided.')
                .replace('{diagramSummary}', diagramSummary + '\n\n(A visual snapshot of the diagram has been attached for your analysis.)');

            const response = await aiService.generateCompletion(prompt, undefined, base64Image ? [base64Image] : undefined);
            const jsonStr = response.replace(/```json\n?|```\n?|\n?```/g, '').trim();
            const analysis = JSON.parse(jsonStr);

            // Add snapshot of the current design
            if (currentData && currentData.elements) {
                analysis.snapshot = {
                    elements: currentData.elements.filter((e: any) => !e.isDeleted),
                    appState: currentData.appState || {}
                };
            }

            setAiAnalysis(analysis);

            // Save analysis to backend
            await systemDesignApi.updateSubmission(currentSubmissionId, {
                // aiAnalysis is not persisted
            });

            toast.success('Analysis complete!');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze design');
        } finally {
            setIsAnalyzing(false);
        }
    }, [currentSubmissionId, problem, notes]);

    const [isRequestingHint, setIsRequestingHint] = useState(false);

    const handleGetHint = useCallback(async () => {
        if (!aiService.isConfigured()) {
            toast.error('AI is not configured. Please go to Settings.');
            return;
        }

        setIsRequestingHint(true);
        try {
            const currentData = excalidrawDataRef.current;
            // Extract diagram summary
            let diagramSummary = 'No diagram created.';
            if (currentData && currentData.elements && currentData.elements.length > 0) {
                const nodes = currentData.elements.filter((el: any) => !el.isDeleted && el.type !== 'arrow').length;
                const edges = currentData.elements.filter((el: any) => !el.isDeleted && el.type === 'arrow').length;
                const textElements = currentData.elements.filter((el: any) => !el.isDeleted && el.type === 'text').map((el: any) => el.text).join(', ');
                diagramSummary = `Diagram contains ${nodes} nodes and ${edges} connections. Text labels found: ${textElements}`;
            }

            // Generate snapshot for AI (reuse logic if possible, but duplicating for safety/speed)
            let base64Image: string | undefined;
            if (currentData && currentData.elements && currentData.elements.length > 0) {
                try {
                    const blob = await exportToBlob({
                        elements: currentData.elements.filter((e: any) => !e.isDeleted),
                        appState: {
                            ...currentData.appState,
                            exportWithDarkMode: true,
                            exportBackground: false,
                        },
                        files: null,
                        mimeType: 'image/png',
                        quality: 0.8,
                    });

                    base64Image = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error('Failed to generate snapshot for AI:', error);
                }
            }

            const prompt = PROMPTS.SYSTEM_DESIGN_HINT
                .replace('{problemTitle}', problem?.title || 'System Design Problem')
                .replace('{problemDescription}', problem?.description || '')
                .replace('{userNotes}', notes || 'No notes provided.')
                .replace('{diagramSummary}', diagramSummary);

            const hint = await aiService.generateCompletion(prompt, undefined, base64Image ? [base64Image] : undefined);

            // Show hint in toast or returning it?
            // Coding problems show it in a modal or inline?
            // Let's return it to the UI to handle display.
            return hint;

        } catch (error) {
            console.error('Hint generation failed:', error);
            toast.error('Failed to get hint');
            return null;
        } finally {
            setIsRequestingHint(false);
        }
    }, [problem, notes]);

    const handleMarkAsSolution = useCallback(async (submissionId: string, name?: string) => {
        try {
            await systemDesignApi.markAsSolution(submissionId, name);

            // Refresh submissions list to update UI
            if (id) {
                const subs = await systemDesignApi.getUserSubmissions(id);
                setSubmissions(subs);
            }

            toast.success('Solution status updated');
        } catch (error) {
            console.error('Failed to mark as solution:', error);
            toast.error('Failed to update solution status');
        }
    }, [id]);

    const handleDeleteSubmission = useCallback(async (submissionId: string) => {
        // Confirmation is handled by the UI Modal component now
        try {
            await systemDesignApi.deleteSubmission(submissionId);

            if (currentSubmissionId === submissionId) {
                setCurrentSubmissionId(null);
            }

            if (id) {
                const subs = await systemDesignApi.getUserSubmissions(id);
                setSubmissions(subs);
            }
            toast.success('Submission deleted');
        } catch (error) {
            console.error('Failed to delete submission:', error);
            toast.error('Failed to delete submission');
        }
    }, [id, currentSubmissionId]);

    return {
        problem,
        notes,
        setNotes,
        excalidrawData: initialExcalidrawData, // Changed to expose initial state for loading
        resetKey, // Key that increments on reset to force wrapper effect
        updateExcalidrawData, // New method to update ref without re-render
        currentExcalidrawData: excalidrawDataRef.current, // Expose current data if needed (warning: non-reactive)
        resetCanvas, // New method to reset canvas
        isSaving,
        lastSaved,
        timeSpentSeconds,
        setTimeSpentSeconds,
        handleSave,
        handleSubmit,
        submissions,
        solutions,
        aiAnalysis,
        isAnalyzing,
        handleAnalyze,
        loadSubmission,
        handleMarkAsSolution,
        handleDeleteSubmission,
        handleGetHint,
        isRequestingHint
    };
}
