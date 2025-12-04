import { useEffect, useState, lazy, Suspense } from 'react';
import { LoadingThunder } from '@/design-system/components';
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
        --color-primary: hsl(var(--primary)) !important;
        --color-primary-darker: hsl(var(--primary) / 0.8) !important;
        --color-primary-darkest: hsl(var(--primary) / 0.6) !important;
        --color-primary-light: hsl(var(--primary) / 0.9) !important;
        --color-brand-active: hsl(var(--primary)) !important;
        --color-brand-hover: hsl(var(--primary) / 0.8) !important;
      }

      .excalidraw.theme--dark {
        /* Primary Brand Colors */
        --color-primary: hsl(var(--primary)) !important;
        --color-primary-darker: hsl(var(--primary) / 0.8) !important;
        --color-primary-darkest: hsl(var(--primary) / 0.6) !important;
        --color-primary-light: hsl(var(--primary) / 0.9) !important;

        /* UI Surface Colors */
        --color-surface-lowest: hsl(var(--background)) !important;
        --color-surface-low: hsl(var(--card)) !important;
        --color-surface-mid: hsl(var(--popover)) !important;
        --color-surface-high: hsl(var(--secondary)) !important;

        /* Text/Icon Colors */
        --color-on-surface: hsl(var(--foreground)) !important;
        --icon-fill-color: hsl(var(--foreground)) !important;

        /* Button States */
        --button-hover-bg: hsl(var(--secondary)) !important;
        --button-active-bg: hsl(var(--secondary) / 0.8) !important;
        --button-active-border: hsl(var(--primary)) !important;

        /* Brand Colors for UI */
        --color-brand-hover: hsl(var(--primary) / 0.8) !important;
        --color-brand-active: hsl(var(--primary)) !important;

        /* Primary Container (Active States) */
        --color-surface-primary-container: hsl(var(--primary) / 0.15) !important;
        --color-on-primary-container: hsl(var(--primary)) !important;

        /* Island (Toolbar) Background */
        --island-bg-color: hsl(var(--card)) !important;
        --popup-bg-color: hsl(var(--popover)) !important;
        --popup-secondary-bg-color: hsl(var(--background)) !important;

        /* Selection */
        --color-selection: hsl(var(--primary)) !important;
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
        <div style={{ height: '100vh', width: '100vw', backgroundColor: 'hsl(var(--background))' }}>
            <Suspense
                fallback={
                    <div className="h-full w-full flex items-center justify-center bg-background">
                        <LoadingThunder size="lg" />
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
