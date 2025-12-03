import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SystemDesignListPage from './SystemDesignListPage';
import * as useSystemDesignProblemsHook from '@/features/system-design/hooks/useSystemDesignProblems';

// Mock the hook
vi.mock('@/features/system-design/hooks/useSystemDesignProblems', () => ({
    useSystemDesignProblems: vi.fn()
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('SystemDesignListPage', () => {
    const mockProblems = [
        {
            id: '1',
            title: 'Design Twitter',
            difficulty: 'Medium',
            status: 'Todo',
            tags: ['Social Media', 'High Scale'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
        },
        {
            id: '2',
            title: 'Design Uber',
            difficulty: 'Hard',
            status: 'Solved',
            tags: ['Ride Sharing', 'Real-time'],
            createdAt: '2023-01-02T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
        }
    ];

    const mockHookValues = {
        problems: mockProblems,
        isLoading: false,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        filterDifficulties: [],
        setFilterDifficulties: vi.fn(),
        filterStatus: [],
        setFilterStatus: vi.fn(),
        filterTags: [],
        setFilterTags: vi.fn(),
        sortConfig: { key: 'createdAt', direction: 'desc' },
        handleSort: vi.fn(),
        selectedIds: new Set(),
        setSelectedIds: vi.fn(),
        toggleSelectAll: vi.fn(),
        toggleSelectOne: vi.fn(),
        deleteProblem: vi.fn(),
        bulkDelete: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSystemDesignProblemsHook.useSystemDesignProblems as any).mockReturnValue(mockHookValues);
    });

    it('renders the page title and create button', () => {
        render(
            <MemoryRouter>
                <SystemDesignListPage />
            </MemoryRouter>
        );

        expect(screen.getByText('System Design Problems')).toBeInTheDocument();
        expect(screen.getByText('Create Problem')).toBeInTheDocument();
    });

    it('navigates to create page on button click', () => {
        render(
            <MemoryRouter>
                <SystemDesignListPage />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Create Problem'));
        expect(mockNavigate).toHaveBeenCalledWith('/system-design/new');
    });

    it('renders the problems table', () => {
        render(
            <MemoryRouter>
                <SystemDesignListPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Design Twitter')).toBeInTheDocument();
        expect(screen.getByText('Design Uber')).toBeInTheDocument();
    });

    it('opens delete confirmation modal when delete is clicked', async () => {
        render(
            <MemoryRouter>
                <SystemDesignListPage />
            </MemoryRouter>
        );

        // Open the menu for the first problem
        const menuTriggers = screen.getAllByRole('button', { hidden: true }).filter(btn => btn.classList.contains('row-action-menu-trigger'));
        fireEvent.click(menuTriggers[0]);

        // Click delete in the menu
        const deleteBtn = screen.getByText('Delete');
        fireEvent.click(deleteBtn);

        // Check if modal is open
        expect(screen.getByText('Delete Problem')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        expect(screen.getByText('"Design Twitter"')).toBeInTheDocument();
    });

    it('calls deleteProblem when confirmed', async () => {
        render(
            <MemoryRouter>
                <SystemDesignListPage />
            </MemoryRouter>
        );

        // Open menu and click delete
        const menuTriggers = screen.getAllByRole('button', { hidden: true }).filter(btn => btn.classList.contains('row-action-menu-trigger'));
        fireEvent.click(menuTriggers[0]);
        fireEvent.click(screen.getByText('Delete'));

        // Confirm delete
        // The modal buttons are "Cancel" and "Delete". We need to click the "Delete" button in the modal.
        // Since there are multiple "Delete" texts (one in menu, one in modal title, one in button), we should be specific.
        // The button in the modal has text "Delete" and is likely the last one or we can find it by class or role.
        // Let's use getAllByText and pick the one in the modal footer.
        const deleteButtons = screen.getAllByText('Delete');
        // The last one should be the confirm button in the modal
        fireEvent.click(deleteButtons[deleteButtons.length - 1]);

        await waitFor(() => {
            expect(mockHookValues.deleteProblem).toHaveBeenCalledWith('1');
        });
    });
});
