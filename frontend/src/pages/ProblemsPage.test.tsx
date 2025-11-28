import { render, screen, waitFor, fireEvent } from '@/test-utils';
import ProblemsPage from './ProblemsPage';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock AddToListModal
vi.mock('@/components/lists/AddToListModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="add-to-list-modal">Add to List Modal</div> : null),
}));

describe('ProblemsPage', () => {
  it('renders problems list', async () => {
    server.use(
      http.get('http://localhost:3000/problems', () => {
        return HttpResponse.json({
          problems: [
            {
              id: '1',
              title: 'Two Sum',
              slug: 'two-sum',
              difficulty: 'Easy',
              tags: ['Array', 'Hash Table'],
              status: 'Solved',
              acceptance: 50,
            },
            {
              id: '2',
              title: 'Add Two Numbers',
              slug: 'add-two-numbers',
              difficulty: 'Medium',
              tags: ['Linked List', 'Math'],
              status: 'Todo',
              acceptance: 40,
            },
          ],
          hasMore: false,
        });
      })
    );

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    server.use(
      http.get('http://localhost:3000/problems', () => {
        return HttpResponse.json({
          problems: [],
          hasMore: false,
        });
      })
    );

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('No problems found')).toBeInTheDocument();
    });
  });

  it('handles selection and bulk actions', async () => {
    server.use(
      http.get('http://localhost:3000/problems', () => {
        return HttpResponse.json({
          problems: [
            {
              id: '1',
              title: 'Two Sum',
              slug: 'two-sum',
              difficulty: 'Easy',
              tags: [],
              status: 'Todo',
            },
          ],
          hasMore: false,
        });
      })
    );

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    // Select problem
    const checkbox = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-square'));
    if (checkbox) fireEvent.click(checkbox);

    // Check if floating action bar appears
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Selected count
      expect(screen.getByText('Selected')).toBeInTheDocument();
      expect(screen.getByText('Add to List')).toBeInTheDocument();
    });

    // Click Add to List
    fireEvent.click(screen.getByText('Add to List'));

    expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();
  });
});
