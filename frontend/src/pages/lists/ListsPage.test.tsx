import { render, screen, fireEvent } from '@/test-utils';
import ListsPage from './ListsPage';
import { vi, describe, it, expect } from 'vitest';

// Mock hooks
const mockCreateList = vi.fn();
const mockDeleteList = vi.fn();

vi.mock('@/hooks/useLists', () => ({
    useLists: () => ({
        data: {
            data: [
                {
                    id: '1',
                    name: 'Blind 75',
                    description: 'Essential questions',
                    updatedAt: new Date().toISOString(),
                    _count: { problems: 75 },
                    solvedCount: 10,
                    problems: [],
                },
            ],
        },
        isLoading: false,
    }),
    useCreateList: () => ({
        mutateAsync: mockCreateList,
    }),
    useDeleteList: () => ({
        mutateAsync: mockDeleteList,
    }),
}));

describe('ListsPage', () => {
    it('renders lists correctly', () => {
        render(<ListsPage />);
        expect(screen.getByText('My Lists')).toBeInTheDocument();
        expect(screen.getByText('Blind 75')).toBeInTheDocument();
    });

    it('opens create list modal', () => {
        render(<ListsPage />);
        fireEvent.click(screen.getByText('New List'));
        expect(screen.getByText('Create New List')).toBeInTheDocument();
    });
});
