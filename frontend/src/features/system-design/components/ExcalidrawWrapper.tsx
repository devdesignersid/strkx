import { useEffect, useRef } from 'react';

// NO Excalidraw CSS imports here!

interface ExcalidrawWrapperProps {
    initialData?: any;
    resetKey?: number;
    onChange?: (elements: readonly any[], appState: any) => void;
    onSave?: () => void;
    readOnly?: boolean;
}

export default function ExcalidrawWrapper({
    initialData,
    resetKey,
    onChange,
    onSave,
    readOnly = false,
}: ExcalidrawWrapperProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const loadedDataVersion = useRef<string>('');
    const lastEmittedVersion = useRef<string>('');


    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            const { type, payload } = event.data;
            if (type === 'CANVAS_CHANGE') {
                // Track the version we just emitted to avoid reloading it
                const elementIds = payload.elements?.map((e: any) => e.id).sort().join(',') || '';
                lastEmittedVersion.current = elementIds;

                onChange?.(payload.elements, payload.appState);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onChange]);

    // Push initial data when iframe loads
    const handleLoad = () => {
        if (iframeRef.current && initialData) {
            const elementIds = initialData.elements?.map((e: any) => e.id).sort().join(',') || '';
            iframeRef.current.contentWindow?.postMessage(
                { type: 'LOAD_DATA', payload: { ...initialData, readOnly } },
                window.location.origin
            );
            loadedDataVersion.current = elementIds;
            lastEmittedVersion.current = elementIds; // Sync initial state

            // Trigger zoom to fit after data loads
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                    { type: 'ZOOM_TO_FIT' },
                    window.location.origin
                );
            }, 100);
        }
    };

    // Watch for data changes and reload
    useEffect(() => {
        if (!iframeRef.current) {
            return;
        }

        // Propagate null/undefined initialData as a reset (empty elements)
        const targetData = initialData || { elements: [], appState: {} };
        const elementIds = targetData.elements?.map((e: any) => e.id).sort().join(',') || '';

        // If this data matches what we just emitted, ignore it (loopback prevention)
        if (elementIds === lastEmittedVersion.current && elementIds !== '') {
            loadedDataVersion.current = elementIds;
            return;
        }

        // Special handling for Reset:
        // If targetData is empty (reset) AND the canvas currently has content
        // Use lastEmittedVersion because user may have drawn content without loading from props
        const isReset = elementIds === '' && lastEmittedVersion.current !== '';

        const shouldLoad = (elementIds && elementIds !== loadedDataVersion.current) || isReset;

        if (shouldLoad) {
            iframeRef.current.contentWindow?.postMessage(
                { type: 'LOAD_DATA', payload: { ...targetData, readOnly } },
                window.location.origin
            );
            loadedDataVersion.current = elementIds;
            lastEmittedVersion.current = elementIds;

            // Trigger zoom to fit ONLY when loading actual data (not on reset)
            // Skipping zoom on reset prevents interference with first drawing operation
            if (targetData.elements && targetData.elements.length > 0) {
                setTimeout(() => {
                    iframeRef.current?.contentWindow?.postMessage(
                        { type: 'ZOOM_TO_FIT' },
                        window.location.origin
                    );
                }, 100);
            }
        }
    }, [initialData, resetKey, readOnly]);

    // Keyboard shortcuts (forwarded from iframe or handled here if focus is on wrapper)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+S or Ctrl+S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave]);

    return (
        <div className="h-full w-full bg-background relative">
            <iframe
                ref={iframeRef}
                src="/excalidraw-canvas"
                className="w-full h-full border-0 block"
                onLoad={handleLoad}
                title="Excalidraw Canvas"
            />
        </div>
    );
}
