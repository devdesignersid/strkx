import { render, screen } from '@/test-utils';
import DashboardPage from './DashboardPage';
import { vi, describe, it, expect } from 'vitest';

// Mock hooks
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { name: 'Test User' },
    }),
}));

vi.mock('@/context/StudyTimerContext', () => ({
    useStudyTimer: () => ({
        isEnabled: true,
    }),
    StudyTimerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useDashboardStats', () => ({
    useDashboardStats: () => ({
        data: {
            data: {
                easy: 10,
                medium: 5,
                hard: 2,
                solved: 17,
                ranking: 100,
                weeklyChange: 5,
                studyTime: '2h 30m',
                systemDesignSolved: 1,
                totalHours: 10,
            },
        },
        isLoading: false,
    }),
    useDashboardActivity: () => ({
        data: {
            data: [],
        },
        isLoading: false,
    }),
    useDashboardHeatmap: () => ({
        data: {
            data: [],
        },
        isLoading: false,
    }),
}));

describe('DashboardPage', () => {
    it('renders dashboard correctly', () => {
        render(<DashboardPage />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText(/Good (morning|afternoon|evening), Test User!/)).toBeInTheDocument();
        expect(screen.getByText('Focus Time')).toBeInTheDocument();
        expect(screen.getByText('2h 30m')).toBeInTheDocument();
        expect(screen.getByText('Activity Heatmap')).toBeInTheDocument();
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
});
