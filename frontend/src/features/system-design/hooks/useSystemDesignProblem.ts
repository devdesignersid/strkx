import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { SystemDesignProblem } from '@/types/system-design';
import { NOTES_TEMPLATE } from '@/types/system-design';
import { systemDesignApi } from '../api/systemDesignApi';
import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import { exportToBlob } from '@excalidraw/excalidraw';

export function useSystemDesignProblem(id: string | undefined) {
    const [problem, setProblem] = useState<SystemDesignProblem | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [solutions, _setSolutions] = useState<any[]>([]); // TODO: Fetch solutions

    const [notes, setNotes] = useState(NOTES_TEMPLATE);
    const [excalidrawData, setExcalidrawData] = useState<any>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

    const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Fetch problem details
    useEffect(() => {
        if (!id) return;

        const fetchProblem = async () => {
            try {
                const data = await systemDesignApi.getProblem(id);
                setProblem(data);
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
                    if (inProgress.excalidrawJson) setExcalidrawData(inProgress.excalidrawJson);
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
                excalidrawJson: excalidrawData,
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
    }, [id, currentSubmissionId, excalidrawData, notes, timeSpentSeconds]);

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
        setExcalidrawData(submission.excalidrawJson || null);

        // If notes are present (even empty string), use them. Otherwise fallback to template?
        // Better to just use what's there. If it's undefined, maybe keep current?
        // No, we should probably reset to what's in the submission.
        setNotes(submission.notesMarkdown !== undefined ? submission.notesMarkdown : NOTES_TEMPLATE);

        if (submission.timeSpentSeconds !== undefined) {
            setTimeSpentSeconds(submission.timeSpentSeconds);
        }

        setCurrentSubmissionId(submission.id);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!id) return { success: false };
        setIsSaving(true);

        try {
            const data = {
                problemId: id,
                excalidrawJson: excalidrawData,
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

            return { success: true };
        } catch (error) {
            console.error('Failed to submit:', error);
            return { success: false };
        } finally {
            setIsSaving(false);
        }
    }, [id, excalidrawData, notes, timeSpentSeconds]);

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
            // Extract diagram summary
            let diagramSummary = 'No diagram created.';
            if (excalidrawData && excalidrawData.elements && excalidrawData.elements.length > 0) {
                const nodes = excalidrawData.elements.filter((el: any) => !el.isDeleted && el.type !== 'arrow').length;
                const edges = excalidrawData.elements.filter((el: any) => !el.isDeleted && el.type === 'arrow').length;
                const textElements = excalidrawData.elements.filter((el: any) => !el.isDeleted && el.type === 'text').map((el: any) => el.text).join(', ');
                diagramSummary = `Diagram contains ${nodes} nodes and ${edges} connections. Text labels found: ${textElements}`;
            }

            // Generate snapshot for AI analysis
            let base64Image: string | undefined;
            if (excalidrawData && excalidrawData.elements && excalidrawData.elements.length > 0) {
                try {
                    const blob = await exportToBlob({
                        elements: excalidrawData.elements.filter((e: any) => !e.isDeleted),
                        appState: {
                            ...excalidrawData.appState,
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
            if (excalidrawData && excalidrawData.elements) {
                analysis.snapshot = {
                    elements: excalidrawData.elements.filter((e: any) => !e.isDeleted),
                    appState: excalidrawData.appState || {}
                };
            }

            setAiAnalysis(analysis);

            // Save analysis to backend
            await systemDesignApi.updateSubmission(currentSubmissionId, {
                aiAnalysis: analysis
            });

            toast.success('Analysis complete!');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze design');
        } finally {
            setIsAnalyzing(false);
        }
    }, [currentSubmissionId, problem, notes, excalidrawData]);

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

    return {
        problem,
        notes,
        setNotes,
        excalidrawData,
        setExcalidrawData,
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
        handleMarkAsSolution
    };
}
