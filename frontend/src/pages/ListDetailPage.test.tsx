import { render, screen, waitFor } from '@/test-utils';
import ListDetailPage from './lists/ListDetailPage';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { API_URL } from '@/config';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ListDetailPage', () => {
  it('renders list details and problems', async () => {
    server.use(
      http.get(`${API_URL}/lists/1`, () => {
        return HttpResponse.json({
          data: {
            id: '1',
            name: 'Blind 75',
            description: 'Essential problems',
            problems: [
              {
                problem: {
                  id: 'p1',
                  title: 'Two Sum',
                  slug: 'two-sum',
                  difficulty: 'Easy',
                  tags: ['Array'],
                  status: 'Solved',
                  acceptance: 80,
                },
              },
            ],
            hasMore: false,
          }
        });
      })
    );

    render(
      <Routes>
        <Route path="/lists/:id" element={<ListDetailPage />} />
      </Routes>,
      {
        initialEntries: ['/lists/1'],
      }
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Blind 75' })).toBeInTheDocument();
      expect(screen.getByText('Essential problems')).toBeInTheDocument();
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });
  });
});
