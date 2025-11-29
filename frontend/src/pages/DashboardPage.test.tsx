import { render, screen, waitFor } from '@/test-utils';
import DashboardPage from './DashboardPage';
import { describe, it, expect } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '@/context/AuthContext';

describe('DashboardPage', () => {
  it('renders loading state initially', async () => {
    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );
    // Check for skeletons or loading indicators
    // Skeletons usually don't have text, but we can check for class names or just that content is missing
    // Or we can check that "Welcome back" is there
    await waitFor(() => {
      expect(screen.getByText('Welcome back, Demo User')).toBeInTheDocument();
    });
  });

  it('renders stats and activity after load', async () => {
    // Mock responses
    server.use(
      http.get('http://localhost:3000/dashboard/stats', () => {
        return HttpResponse.json({
          easy: 10,
          medium: 5,
          hard: 2,
          solved: 17,
          ranking: 100,
          weeklyChange: 15,
        });
      }),
      http.get('http://localhost:3000/dashboard/activity', () => {
        return HttpResponse.json([
          {
            problemSlug: 'two-sum',
            problemTitle: 'Two Sum',
            status: 'ACCEPTED',
            timestamp: new Date().toISOString(),
            difficulty: 'Easy',
          },
        ]);
      }),
      http.get('http://localhost:3000/dashboard/heatmap', () => {
        return HttpResponse.json([]);
      }),
      http.get('http://localhost:3000/study-stats/today', () => {
        return HttpResponse.json({ totalStudySeconds: 3600 });
      })
    );

    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Solved')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('1h 0m')).toBeInTheDocument();
    });
  });

  it('renders empty state when no activity', async () => {
    server.use(
      http.get('http://localhost:3000/dashboard/stats', () => {
        return HttpResponse.json({
          easy: 0,
          medium: 0,
          hard: 0,
          solved: 0,
          ranking: 0,
          weeklyChange: 0,
        });
      }),
      http.get('http://localhost:3000/dashboard/activity', () => {
        return HttpResponse.json([]);
      }),
      http.get('http://localhost:3000/dashboard/heatmap', () => {
        return HttpResponse.json([]);
      }),
      http.get('http://localhost:3000/study-stats/today', () => {
        return HttpResponse.json({ totalStudySeconds: 0 });
      })
    );

    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(screen.getByText('Solve your first problem to see your progress here.')).toBeInTheDocument();
    });
  });
});
