import { render, screen, waitFor } from '@/test-utils';
import MockInterviewSummary from './MockInterviewSummary';
import { vi } from 'vitest';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { API_URL } from '@/config';

// Mock confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

// Mock useParams
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useParams: () => ({ sessionId: 'session-123' }),
        useNavigate: () => vi.fn(),
    };
});

describe('MockInterviewSummary', () => {
    beforeEach(() => {
        server.resetHandlers();
    });

    it('renders summary correctly', async () => {
        const mockSummary = {
            id: 'session-123',
            status: 'COMPLETED',
            questions: [
                {
                    id: 'q1',
                    problem: { title: 'Two Sum', difficulty: 'Easy' },
                    status: 'COMPLETED',
                    outcome: 'PASSED',
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(),
                    autoSubmitted: false
                }
            ],
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        server.use(
            http.get(`${API_URL}/interview-sessions/session-123`, () => {
                return HttpResponse.json({ data: mockSummary });
            })
        );

        render(<MockInterviewSummary />);

        await waitFor(() => {
            expect(screen.getByText('Interview Complete')).toBeInTheDocument();
            expect(screen.getByText('100%')).toBeInTheDocument(); // Score
            expect(screen.getByText('Two Sum')).toBeInTheDocument();
            expect(screen.getByText('Passed')).toBeInTheDocument();
        });
    });
});
