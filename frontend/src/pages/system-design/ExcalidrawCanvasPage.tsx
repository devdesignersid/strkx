import { useEffect, useState, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';

// Lazy load Excalidraw
const Excalidraw = lazy(() =>
    import('@excalidraw/excalidraw').then((module) => ({
        default: module.Excalidraw,
    }))
);

export default function ExcalidrawCanvasPage() {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [viewModeEnabled, setViewModeEnabled] = useState(false);

    useEffect(() => {
        // Listen for messages from the parent (Main App)
        const handleMessage = (event: MessageEvent) => {
            // Security check: Ensure message comes from your own domain
            if (event.origin !== window.location.origin) return;

            const { type, payload } = event.data;

            if (type === 'LOAD_DATA') {
                if (excalidrawAPI && payload.elements) {
                    // Ensure appState has proper structure
                    const normalizedAppState = {
                        ...payload.appState,
                        collaborators: new Map(),
                    };
                    excalidrawAPI.updateScene({
                        elements: payload.elements,
                        appState: normalizedAppState
                    });
                }
                if (payload.readOnly !== undefined) {
                    setViewModeEnabled(payload.readOnly);
                }
            }

            if (type === 'ZOOM_TO_FIT') {
                if (excalidrawAPI) {
                    excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
                        fitToContent: true,
                        animate: true,
                    });
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [excalidrawAPI]);

    useEffect(() => {
        // Inject custom styles for Excalidraw to match app theme
        const style = document.createElement('style');
        style.id = 'excalidraw-custom-theme';
        style.innerHTML = `
      .excalidraw {
        --color-primary: #3ECF8E !important;
        --color-primary-darker: #34b078 !important;
        --color-primary-darkest: #2a8f62 !important;
        --color-primary-light: #65d9a5 !important;
        --color-brand-active: #3ECF8E !important;
        --color-brand-hover: #34b078 !important;
      }

      .excalidraw.theme--dark {
        /* Primary Brand Colors */
        --color-primary: #3ECF8E !important;
        --color-primary-darker: #34b078 !important;
        --color-primary-darkest: #2a8f62 !important;
        --color-primary-light: #65d9a5 !important;

        /* UI Surface Colors */
        --color-surface-lowest: #151515 !important;
        --color-surface-low: #1C1C1C !important;
        --color-surface-mid: #232323 !important;
        --color-surface-high: #2E2E2E !important;

        /* Text/Icon Colors */
        --color-on-surface: #EDEDED !important;
        --icon-fill-color: #EDEDED !important;

        /* Button States */
        --button-hover-bg: #2E2E2E !important;
        --button-active-bg: #262626 !important;
        --button-active-border: #3ECF8E !important;

        /* Brand Colors for UI */
        --color-brand-hover: #34b078 !important;
        --color-brand-active: #3ECF8E !important;

        /* Primary Container (Active States) */
        --color-surface-primary-container: rgba(62, 207, 142, 0.15) !important;
        --color-on-primary-container: #3ECF8E !important;

        /* Island (Toolbar) Background */
        --island-bg-color: #1C1C1C !important;
        --popup-bg-color: #1C1C1C !important;
        --popup-secondary-bg-color: #151515 !important;

        /* Selection */
        --color-selection: #3ECF8E !important;
      }

      /* User requested fix for active tool icons */
      .excalidraw .ToolIcon.fillable .ToolIcon_type_radio:checked + .ToolIcon__icon,
      .excalidraw .ToolIcon.fillable .ToolIcon_type_checkbox:checked + .ToolIcon__icon {
        --icon-fill-color: var(--color-on-primary-container) !important;
      }

      /* Hide the theme toggle since we control it */
      .excalidraw .App-menu_top .buttonList label[title="Theme"] {
        display: none !important;
      }

      /* Hide Main Menu (Hamburger) specifically */
      .excalidraw .App-menu_top .dropdown-menu-button,
      .excalidraw .App-menu_top button[aria-label="Main menu"] {
        display: none !important;
      }

      /* Hide Library Button */
      .excalidraw .layer-ui__library,
      .excalidraw button[title="Library"],
      .excalidraw label[title="Library"] {
        display: none !important;
      }

      /* Hide Toolbar Dividers */
      .excalidraw .App-toolbar__divider {
        display: none !important;
      }

      /* Hide Help Button */
      .excalidraw .help-icon {
        display: none !important;
      }
    `;

        document.head.appendChild(style);

        return () => {
            style.remove();
        };
    }, []);

    // Send data back to parent on change
    const handleChange = (elements: readonly any[], appState: any) => {
        window.parent.postMessage(
            { type: 'CANVAS_CHANGE', payload: { elements, appState } },
            window.location.origin
        );
    };

    return (
        <div style={{ height: '100vh', width: '100vw', backgroundColor: '#151515' }}>
            <Suspense
                fallback={
                    <div className="h-full w-full flex items-center justify-center bg-[#151515]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3ECF8E]" />
                    </div>
                }
            >
                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    onChange={handleChange}
                    theme="dark"
                    viewModeEnabled={viewModeEnabled}
                    UIOptions={{
                        canvasActions: {
                            loadScene: false,
                        },
                    }}
                />
            </Suspense>
        </div>
    );
}
