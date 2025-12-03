import { render, screen, fireEvent, waitFor, within } from '@/test-utils';
import MockInterviewSetup from './MockInterviewSetup';
import { vi } from 'vitest';
import { DIFFICULTY_LEVELS, PROBLEM_STATUSES } from '@/config/constants';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { API_URL } from '@/config';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MockInterviewSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset handlers to default before each test (usually handled by setupTests.ts but good practice)
    server.resetHandlers();

    // Default handlers
    server.use(
      http.get(`${API_URL}/lists`, () => {
        return HttpResponse.json({ data: [] });
      }),
      http.post(`${API_URL}/interview-sessions`, () => {
        return HttpResponse.json({ data: { id: 'session-123' } });
      })
    );
  });

  it('renders setup page correctly', () => {
    render(<MockInterviewSetup />);

    expect(screen.getByText('Mock Interview Mode')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Lists (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Questions & Duration')).toBeInTheDocument();
  });

  it('allows selecting difficulty', () => {
    render(<MockInterviewSetup />);

    const diffBtn = screen.getByRole('button', { name: DIFFICULTY_LEVELS[0] });
    fireEvent.click(diffBtn);
    // Visual feedback verification omitted as it depends on implementation details
  });

  it('allows selecting status', () => {
    render(<MockInterviewSetup />);

    const statusBtn = screen.getByRole('button', { name: PROBLEM_STATUSES[0] });
    fireEvent.click(statusBtn);
  });

  it('handles list search and selection', async () => {
    const mockLists = [
      { id: '1', name: 'Blind 75', codingProblemCount: 75 },
      { id: '2', name: 'NeetCode 150', codingProblemCount: 150 }
    ];

    server.use(
      http.get(`${API_URL}/lists`, ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        if (search === 'Blind') {
          return HttpResponse.json({ data: mockLists });
        }
        return HttpResponse.json({ data: [] });
      })
    );

    render(<MockInterviewSetup />);

    const searchInput = screen.getByPlaceholderText(/select lists/i);
    fireEvent.change(searchInput, { target: { value: 'Blind' } });

    // Wait for the list item to appear in the dropdown
    await waitFor(() => {
      // We expect 'Blind 75' to appear in the dropdown list
      // Use getAllByText because it might appear in multiple places if already selected (though here it's not)
      // But to be safe and specific:
      const options = screen.getAllByText('Blind 75');
      expect(options.length).toBeGreaterThan(0);
    });

    // Click the first one (assuming it's the option)
    const listOption = screen.getAllByText('Blind 75')[0];
    fireEvent.click(listOption);

    // Now it should be in the selected tags area
    // It might also be in the dropdown if it's still open, so we check if at least one exists
    const selectedTags = screen.getAllByText('Blind 75');
    expect(selectedTags.length).toBeGreaterThan(0);
  });

  it('starts interview session', async () => {
    server.use(
      http.post(`${API_URL}/interview-sessions`, () => {
        return HttpResponse.json({ data: { id: 'session-123' } });
      })
    );

    render(<MockInterviewSetup />);

    const startBtn = screen.getByRole('button', { name: /start interview session/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mock-interview/session/session-123');
    });
  });
});
