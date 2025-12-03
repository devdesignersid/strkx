import { render, screen, waitFor, fireEvent } from '@/test-utils';
import ListsPage from './lists/ListsPage';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ListsPage', () => {
  it('renders lists', async () => {
    server.use(
      http.get('http://localhost:3000/lists', () => {
        return HttpResponse.json({
          data: [
            {
              id: '1',
              name: 'Blind 75',
              description: 'Essential problems',
              updatedAt: new Date().toISOString(),
              _count: { problems: 10 },
              solvedCount: 5,
              problems: [],
            },
          ]
        });
      })
    );

    render(<ListsPage />);

    await waitFor(() => {
      expect(screen.getByText('Blind 75')).toBeInTheDocument();
      expect(screen.getByText('Essential problems')).toBeInTheDocument();
      expect(screen.getByText('5 / 10')).toBeInTheDocument();
    });
  });

  it('handles list creation', async () => {
    server.use(
      http.get('http://localhost:3000/lists', () => {
        return HttpResponse.json({ data: [] });
      }),
      http.post('http://localhost:3000/lists', () => {
        return HttpResponse.json({
          data: {
            id: '2',
            name: 'New List',
            description: 'Desc',
            updatedAt: new Date().toISOString(),
            _count: { problems: 0 },
            solvedCount: 0,
            problems: [],
          }
        });
      })
    );

    render(<ListsPage />);

    // Open modal
    const createButton = screen.getByText('New List');
    fireEvent.click(createButton);

    // Fill form
    const nameInput = screen.getByPlaceholderText('E.g. Blind 75');
    fireEvent.change(nameInput, { target: { value: 'New List' } });

    // Submit
    const submitButton = screen.getByText('Create List');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('New List')).toBeInTheDocument();
    });
  });
});
