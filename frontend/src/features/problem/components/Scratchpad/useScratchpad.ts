import { useEffect, useRef, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash-es';
import type { LinkPreviewData } from './LinkPreview';

const LOCAL_PREFIX = 'scratchpad';
const MAX_STROKES = 500; // Maximum strokes to keep (for localStorage size limits)

export interface Stroke {
    x: number;
    y: number;
    size: number;
    color: string;
    pressure?: number;
    t: number;
}

export interface StrokePath {
    points: Stroke[];
    color: string;
    size: number;
}

export interface ScratchpadState {
    version: number;
    lastUpdated: string;
    textHtml?: string;
    strokePaths?: StrokePath[];
    linkPreviews?: Record<string, LinkPreviewData>;
}

interface UseScratchpadOptions {
    serverSave?: (state: ScratchpadState) => Promise<void>;
    initial?: ScratchpadState;
}

const createInitialState = (): ScratchpadState => ({
    version: 1,
    lastUpdated: new Date().toISOString(),
    strokePaths: [],
    textHtml: '',
    linkPreviews: {},
});

export function useScratchpad(problemId: string, opts?: UseScratchpadOptions) {
    const key = `${LOCAL_PREFIX}:${problemId}`;

    const [state, setState] = useState<ScratchpadState>(() => {
        if (opts?.initial) return opts.initial;
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : createInitialState();
        } catch {
            return createInitialState();
        }
    });

    // Debounced save to localStorage (accepts key to avoid stale closure)
    const saveLocal = useRef(
        debounce((s: ScratchpadState, storageKey: string, serverSave?: (state: ScratchpadState) => Promise<void>) => {
            try {
                const serialized = JSON.stringify(s);
                // Check size limit (2MB)
                if (serialized.length > 2 * 1024 * 1024) {
                    console.warn('Scratchpad: Size limit exceeded');
                    return;
                }
                localStorage.setItem(storageKey, serialized);
            } catch (e) {
                console.warn('Scratchpad: Failed to save to localStorage', e);
            }
            if (serverSave) {
                serverSave(s).catch(() => {
                    console.warn('Scratchpad: Failed to save to server');
                });
            }
        }, 800)
    ).current;

    // Auto-save on state change (pass key to avoid stale closure)
    useEffect(() => {
        saveLocal(state, key, opts?.serverSave);
    }, [state, key, saveLocal, opts?.serverSave]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            saveLocal.cancel();
        };
    }, [saveLocal]);

    const setTextHtml = useCallback((html: string) => {
        const clean = DOMPurify.sanitize(html);
        setState((s) => ({
            ...s,
            textHtml: clean,
            lastUpdated: new Date().toISOString(),
        }));
    }, []);

    const pushStrokePath = useCallback((path: StrokePath) => {
        setState((s) => {
            const paths = [...(s.strokePaths || []), path];
            // Trim to max strokes (for localStorage size limits)
            const trimmed = paths.length > MAX_STROKES
                ? paths.slice(paths.length - MAX_STROKES)
                : paths;
            return {
                ...s,
                strokePaths: trimmed,
                lastUpdated: new Date().toISOString(),
            };
        });
    }, []);

    const undoStrokePath = useCallback(() => {
        setState((s) => ({
            ...s,
            strokePaths: (s.strokePaths || []).slice(0, -1),
            lastUpdated: new Date().toISOString(),
        }));
    }, []);

    const wipe = useCallback(() => {
        setState(createInitialState());
    }, []);

    const wipeDrawing = useCallback(() => {
        setState((s) => ({
            ...s,
            strokePaths: [],
            lastUpdated: new Date().toISOString(),
        }));
    }, []);

    const wipeText = useCallback(() => {
        setState((s) => ({
            ...s,
            textHtml: '',
            linkPreviews: {},
            lastUpdated: new Date().toISOString(),
        }));
    }, []);

    const cacheLinkPreview = useCallback((url: string, preview: LinkPreviewData) => {
        setState((s) => ({
            ...s,
            linkPreviews: {
                ...s.linkPreviews,
                [url]: preview,
            },
        }));
    }, []);

    const serialize = useCallback(() => JSON.stringify(state), [state]);

    const restore = useCallback((payload: string) => {
        try {
            const parsed = JSON.parse(payload) as ScratchpadState;
            if (parsed.version) {
                setState(parsed);
            }
        } catch {
            console.warn('Scratchpad: Failed to restore from payload');
        }
    }, []);

    // Force save (flush debounce)
    const forceSave = useCallback(() => {
        saveLocal.flush();
    }, [saveLocal]);

    return {
        state,
        setTextHtml,
        pushStrokePath,
        undoStrokePath,
        wipe,
        wipeDrawing,
        wipeText,
        serialize,
        restore,
        forceSave,
        setState,
        cacheLinkPreview,
    };
}
