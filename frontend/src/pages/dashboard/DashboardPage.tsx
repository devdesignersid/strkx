import { Activity, CheckCircle2 } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, Button, getDifficultyVariant } from '@/design-system/components';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyDashboardIllustration, EmptyActivityIllustration } from '@/design-system/illustrations';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats, useDashboardActivity, useDashboardHeatmap } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { Heatmap } from '@/features/dashboard/components/Heatmap';
import { Card } from '@/design-system/components';



export default function DashboardPage() {
  const { user } = useAuth();
  const { data: statsData, isLoading: isLoadingStats } = useDashboardStats();
  const { data: activityData, isLoading: isLoadingActivity } = useDashboardActivity();
  const { data: heatmapDataRes, isLoading: isLoadingHeatmap } = useDashboardHeatmap();

  const isLoading = isLoadingStats || isLoadingActivity || isLoadingHeatmap;

  const stats = {
    easy: 0,
    medium: 0,
    hard: 0,
    solved: 0,
    ranking: 0,
    weeklyChange: 0,
    studyTime: '0m',
    systemDesignSolved: 0,
    totalHours: 0,
    ...statsData?.data
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentActivity = activityData?.data?.map((item: any) => ({
    id: item.id,
    problem: item.problemTitle,
    status: item.status === 'ACCEPTED' || item.status === 'completed' ? 'Solved' : 'Attempted',
    time: format(new Date(item.timestamp), 'MMM d, h:mm a'),
    difficulty: item.difficulty,
    slug: item.problemSlug,
    type: item.type || 'coding'
  })) || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapData = heatmapDataRes?.data?.map((item: any) => ({
    date: new Date(item.date),
    count: item.count
  })) || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.name || 'User'}!`;
  };

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground font-sans bg-grid-pattern">
      <div className="py-8 mx-auto max-w-7xl px-8">
        <PageHeader
          title="Dashboard"
          description={getGreeting()}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsCard stats={stats} />
        )}

        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-xl mb-8" />
        ) : (
          <>
            {/* Empty State for New Users */}
            {stats.solved === 0 ? (
              <Card className="mb-8">
                <EmptyState
                  illustration={<EmptyDashboardIllustration className="w-full h-full" />}
                  title="Start Your Journey!"
                  description="No practice activity yet. Let's get started with your first problem or mock interview."
                />
                <div className="flex gap-3 justify-center pb-8">
                  <Button size="lg" onClick={() => window.location.href = '/problems'}>
                    <CheckCircle2 className="w-4 h-4" />
                    Browse Problems
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = '/mock-interview'}>
                    <Activity className="w-4 h-4" />
                    Start Mock Interview
                  </Button>
                </div>
              </Card>
            ) : (
              <Heatmap data={heatmapData} />
            )}
          </>
        )}

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50 hover:border-border transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Status indicator - clean icon only */}
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${activity.status === 'Solved'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        {activity.status === 'Solved'
                          ? <CheckCircle2 className="w-4 h-4" />
                          : <Activity className="w-4 h-4" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">

                          <Link
                            to={activity.type === 'system-design' ? `/system-design/${activity.slug}` : `/problems/${activity.slug}`}
                            className="font-medium hover:underline"
                          >
                            {activity.problem}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    </div>
                    <StatusBadge
                      status={activity.difficulty}
                      variant={getDifficultyVariant(activity.difficulty)}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  illustration={<EmptyActivityIllustration className="w-full h-full" />}
                  title="No recent activity"
                  description="Solve your first problem to see your progress here."
                  action={{
                    label: "Browse Problems",
                    onClick: () => window.location.href = '/problems'
                  }}
                  className="py-12"
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
