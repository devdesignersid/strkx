import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProblemsPage from './ProblemsPage';
import { useProblems } from '@/hooks/useProblems';

// Mock useProblems hook
vi.mock('@/hooks/useProblems', () => ({
    useProblems: vi.fn(),
}));

// Mock AddToListModal
vi.mock('@/features/lists/components/AddToListModal', () => ({
    default: ({ isOpen, onClose }: any) => (
        isOpen ? <div data-testid="add-to-list-modal"><button onClick={onClose}>Close Modal</button></div> : null
    ),
}));

// Mock ProblemsTable to simplify testing
vi.mock('@/features/problems/components/ProblemsTable', () => ({
    ProblemsTable: ({ onDelete }: any) => (
        <div data-testid="problems-table">
            <button onClick={() => onDelete('1')}>Delete Problem 1</button>
        </div>
    ),
}));

// Mock ProblemsToolbar
vi.mock('@/features/problems/components/ProblemsToolbar', () => ({
    ProblemsToolbar: ({ onAddToList }: any) => (
        <div data-testid="problems-toolbar">
            <button onClick={onAddToList}>Add to List</button>
        </div>
    ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('ProblemsPage', () => {
    const mockProblems = [
        { id: '1', title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy', tags: ['Array'], status: 'Todo' },
    ];

    const defaultMockValues = {
        problems: mockProblems,
        isLoading: false,
        isLoadingMore: false,
        hasMore: false,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        filterDifficulties: [],
        setFilterDifficulties: vi.fn(),
        filterStatus: [],
        setFilterStatus: vi.fn(),
        filterTags: [],
        setFilterTags: vi.fn(),
        sortConfig: { key: 'title', direction: 'asc' },
        handleSort: vi.fn(),
        selectedIds: new Set(),
        setSelectedIds: vi.fn(),
        toggleSelectAll: vi.fn(),
        toggleSelectOne: vi.fn(),
        loadMore: vi.fn(),
        deleteProblem: vi.fn(),
        bulkDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useProblems as any).mockReturnValue(defaultMockValues);
    });

    it('renders the page title', () => {
        render(<ProblemsPage />);
        expect(screen.getByText('Problems')).toBeInTheDocument();
        expect(screen.getByText('Sharpen your coding skills with our collection of challenges.')).toBeInTheDocument();
    });

    it('navigates to create problem page on button click', () => {
        render(<ProblemsPage />);
        const createButton = screen.getByText('Create Problem');
        fireEvent.click(createButton);
        expect(mockNavigate).toHaveBeenCalledWith('/problems/new');
    });

    it('opens delete confirmation modal when delete is triggered from table', () => {
        render(<ProblemsPage />);

        // Trigger delete from mocked table
        fireEvent.click(screen.getByText('Delete Problem 1'));

        // Check if modal is open (Modal title should be visible)
        expect(screen.getByText('Delete Problem')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('calls deleteProblem when delete is confirmed', async () => {
        render(<ProblemsPage />);

        // Trigger delete
        fireEvent.click(screen.getByText('Delete Problem 1'));

        // Confirm delete
        const deleteButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(defaultMockValues.deleteProblem).toHaveBeenCalledWith('1');
        });
    });

    it('opens add to list modal when triggered from toolbar', () => {
        render(<ProblemsPage />);

        // Trigger add to list from mocked toolbar
        fireEvent.click(screen.getByText('Add to List'));

        expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();
    });
});
