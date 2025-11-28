import { render, screen, waitFor, fireEvent } from '@/test-utils';
import MockInterviewSetup from './MockInterviewSetup';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MockInterviewSetup', () => {
  it('renders setup form', async () => {
    server.use(
      http.get('http://localhost:3000/lists', () => {
        return HttpResponse.json([
          { id: '1', name: 'Blind 75' },
        ]);
      })
    );

    render(<MockInterviewSetup />);

    await waitFor(() => {
      expect(screen.getByText('Mock Interview Mode')).toBeInTheDocument();
      expect(screen.getByText('Blind 75')).toBeInTheDocument();
    });
  });

  it('handles session start', async () => {
    server.use(
      http.get('http://localhost:3000/lists', () => {
        return HttpResponse.json([]);
      }),
      http.post('http://localhost:3000/interview-sessions', () => {
        return HttpResponse.json({ id: 'session-123' });
      })
    );

    render(<MockInterviewSetup />);

    const startButton = screen.getByText('Start Interview');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Preparing Session...')).toBeInTheDocument();
    });
  });
});
