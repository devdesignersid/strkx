import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SystemDesignProblemView from './SystemDesignProblemView';
import { useSystemDesignProblem } from '@/features/system-design/hooks/useSystemDesignProblem';
import { BrowserRouter } from 'react-router-dom';

// Mock the hook
vi.mock('@/features/system-design/hooks/useSystemDesignProblem');

// Mock child components that are complex or external
vi.mock('@/features/system-design/components/ExcalidrawWrapper', () => ({
    default: () => <div data-testid="excalidraw-wrapper">Excalidraw Canvas</div>
}));

vi.mock('@/features/system-design/components/NotesEditor', () => ({
    default: ({ value, onChange, onCollapse }: any) => (
        <div data-testid="notes-editor">
            <textarea value={value} onChange={(e) => onChange(e.target.value)} />
            <button onClick={onCollapse}>Collapse Notes</button>
        </div>
    )
}));

vi.mock('@excalidraw/excalidraw', () => ({
    exportToBlob: vi.fn(),
}));

vi.mock('react-resizable-panels', () => {
    const React = require('react');
    const Panel = React.forwardRef(({ children, onCollapse, onExpand }: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            collapse: () => onCollapse?.(),
            expand: () => onExpand?.(),
            resize: () => { },
            isCollapsed: () => false,
            getSize: () => 50
        }));
        return <div>{children}</div>;
    });
    return {
        PanelGroup: ({ children }: any) => <div>{children}</div>,
        Panel,
        PanelResizeHandle: () => <div>Handle</div>,
    };
});

// Mock resize observer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('SystemDesignProblemView', () => {
    const mockProblem = {
        id: '1',
        title: 'Design Twitter',
        description: 'Design a scalable Twitter clone',
        difficulty: 'Hard',
        defaultDuration: 45,
        tags: ['System Design', 'Scalability']
    };

    const mockHookReturn = {
        problem: mockProblem,
        notes: 'Initial notes',
        setNotes: vi.fn(),
        excalidrawData: null,
        setExcalidrawData: vi.fn(),
        setTimeSpentSeconds: vi.fn(),
        handleSubmit: vi.fn().mockResolvedValue({ success: true }),
        submissions: [],
        solutions: [],
        aiAnalysis: null,
        isAnalyzing: false,
        handleAnalyze: vi.fn(),
        loadSubmission: vi.fn(),
        handleMarkAsSolution: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSystemDesignProblem as any).mockReturnValue(mockHookReturn);
    });

    it('renders loading state when problem is null', () => {
        (useSystemDesignProblem as any).mockReturnValue({ ...mockHookReturn, problem: null });
        render(<SystemDesignProblemView />);
        expect(screen.getByText('Loading problem...')).toBeInTheDocument();
    });

    it('renders problem view when problem is loaded', () => {
        render(
            <BrowserRouter>
                <SystemDesignProblemView />
            </BrowserRouter>
        );
        expect(screen.getByText('Design Twitter')).toBeInTheDocument();
        expect(screen.getByTestId('excalidraw-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('notes-editor')).toBeInTheDocument();
    });

    it('toggles left panel', () => {
        render(
            <BrowserRouter>
                <SystemDesignProblemView />
            </BrowserRouter>
        );

        // Initially left panel is visible (implied by content being there)
        // We can check for the collapse button in the header if it exists, or trigger it via props if we could access state
        // Since we are testing the view, we should interact with the UI

        // The header has a "Show Sidebar" button only when collapsed.
        // Initially it is NOT collapsed.
        // We need to find the collapse button in the description panel or header?
        // In SystemDesignDescription, there is a collapse button.
        // But we didn't mock SystemDesignDescription, so it should be rendered.
        // Let's verify SystemDesignDescription renders.
        expect(screen.getByText('Description')).toBeInTheDocument(); // Tab trigger

        // Find collapse button in description panel
        const collapseBtn = screen.getByTitle('Collapse Description');
        fireEvent.click(collapseBtn);

        // Now left panel should be collapsed.
        // The Header should show "Show Sidebar" button
        expect(screen.getByTitle('Show Sidebar')).toBeInTheDocument();

        // Click "Show Sidebar"
        fireEvent.click(screen.getByTitle('Show Sidebar'));

        // "Show Sidebar" should disappear
        expect(screen.queryByTitle('Show Sidebar')).not.toBeInTheDocument();
    });

    it('toggles right panel', () => {
        render(
            <BrowserRouter>
                <SystemDesignProblemView />
            </BrowserRouter>
        );

        // Find collapse button in Canvas header
        const collapseBtn = screen.getByTitle('Collapse Canvas');
        fireEvent.click(collapseBtn);

        // Header should show "Show Canvas" button
        expect(screen.getByTitle('Show Canvas')).toBeInTheDocument();

        // Click "Show Canvas"
        fireEvent.click(screen.getByTitle('Show Canvas'));

        // "Show Canvas" should disappear
        expect(screen.queryByTitle('Show Canvas')).not.toBeInTheDocument();
    });

    it('handles submit', () => {
        render(
            <BrowserRouter>
                <SystemDesignProblemView />
            </BrowserRouter>
        );

        const submitBtn = screen.getByText('Submit');
        fireEvent.click(submitBtn);

        expect(mockHookReturn.handleSubmit).toHaveBeenCalled();
    });
});
