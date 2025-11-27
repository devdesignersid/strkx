import { useState, useEffect, memo } from 'react';
import { Activity, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { subDays, format, isSameDay, addDays, startOfDay, getDay } from 'date-fns';
import axios from 'axios';

interface ActivityItem {
  id: string;
  problem: string;
  status: string;
  time: string;
  difficulty: string;
  slug: string;
}

interface HeatmapItem {
  date: Date;
  count: number;
}

const StatsCard = memo(({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {/* Solved Card */}
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Total Solved</div>
          <div className="text-4xl font-bold tracking-tight text-foreground">{stats.solved}</div>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
        <span className={cn("font-medium flex items-center gap-0.5", stats.weeklyChange >= 0 ? "text-green-500" : "text-red-500")}>
          {stats.weeklyChange > 0 ? '+' : ''}{stats.weeklyChange}% <span className="text-muted-foreground">vs last week</span>
        </span>
      </div>
    </div>

    {/* Easy Card */}
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-green-500/50 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Easy</div>
          <div className="text-4xl font-bold tracking-tight text-foreground">{stats.easy}</div>
        </div>
        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
        <span className="text-green-500 font-medium">Great Start</span>
      </div>
    </div>

    {/* Medium Card */}
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Medium</div>
          <div className="text-4xl font-bold tracking-tight text-foreground">{stats.medium}</div>
        </div>
        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
        <span className="text-yellow-500 font-medium">Keep Going</span>
      </div>
    </div>

    {/* Hard Card */}
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Hard</div>
          <div className="text-4xl font-bold tracking-tight text-foreground">{stats.hard}</div>
        </div>
        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
          <Activity className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
        <span className="text-red-500 font-medium">Mastery</span>
      </div>
    </div>
  </div>
));

const Heatmap = memo(({ data }: { data: HeatmapItem[] }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; count: number; x: number; y: number } | null>(null);

  // 1. Normalize today to start of day (00:00:00)
  const today = startOfDay(new Date());
  const endDate = today;
  const startDate = subDays(today, 365);

  const dayOfWeek = getDay(startDate);
  const alignedStartDate = subDays(startDate, dayOfWeek);

  const days: { date: Date; count: number }[] = [];
  let currentDate = alignedStartDate;

  while (currentDate <= endDate) {
    const dayData = data.find(d => isSameDay(d.date, currentDate));
    days.push({ date: currentDate, count: dayData ? dayData.count : 0 });
    currentDate = addDays(currentDate, 1);
  }

  const maxCount = Math.max(...data.map(d => d.count), 0);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-secondary/50 hover:bg-secondary';

    // Dynamic scaling based on maxCount
    // If maxCount is small (e.g. < 5), use simple linear scale
    // If maxCount is large, use quartiles

    if (maxCount <= 4) {
      if (count >= 4) return 'bg-primary hover:bg-primary';
      if (count === 3) return 'bg-primary/80 hover:bg-primary/90';
      if (count === 2) return 'bg-primary/50 hover:bg-primary/60';
      return 'bg-primary/20 hover:bg-primary/30';
    }

    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-primary hover:bg-primary';
    if (ratio > 0.5) return 'bg-primary/80 hover:bg-primary/90';
    if (ratio > 0.25) return 'bg-primary/50 hover:bg-primary/60';
    return 'bg-primary/20 hover:bg-primary/30';
  };

  // Group by weeks (vertical columns)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Generate month labels
  const months = weeks.reduce((acc: { name: string; index: number }[], week, i) => {
    const firstDay = week[0].date;
    const monthName = format(firstDay, 'MMM');
    if (i === 0 || monthName !== format(weeks[i - 1][0].date, 'MMM')) {
      acc.push({ name: monthName, index: i });
    }
    return acc;
  }, []).filter((month, i, arr) => {
    // Check if the next label is too close (less than 2 weeks away)
    if (i < arr.length - 1) {
      const nextMonth = arr[i + 1];
      if (nextMonth.index - month.index < 2) {
        return false; // Skip this label if it's too close to the next one
      }
    }
    return true;
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Activity Heatmap</h3>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-secondary/50" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/20" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/50" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/80" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex">
        {/* Day labels column */}
        <div className="flex flex-col space-y-[2px] pr-2 text-[10px] text-muted-foreground leading-none pt-6">
          <div className="h-3 flex items-center invisible">Sun</div>
          <div className="h-3 flex items-center">Mon</div>
          <div className="h-3 flex items-center invisible">Tue</div>
          <div className="h-3 flex items-center">Wed</div>
          <div className="h-3 flex items-center invisible">Thu</div>
          <div className="h-3 flex items-center">Fri</div>
          <div className="h-3 flex items-center invisible">Sat</div>
        </div>

        <div className="flex-1 overflow-x-auto pb-2 scrollbar-hide">
          {/* Month labels Header */}
          <div className="flex mb-2 text-[10px] text-muted-foreground relative h-4">
            {months.map((month, i) => (
              <span
                key={i}
                style={{ left: `${month.index * 14}px` }}
                className="absolute top-0"
              >
                {month.name}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex space-x-[2px]">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col space-y-[2px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredDay({
                        date: day.date,
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      });
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn(
                      "w-3 h-3 rounded-[2px] transition-colors duration-200",
                      getIntensityClass(day.count)
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 border border-border"
          style={{ left: hoveredDay.x, top: hoveredDay.y }}
        >
          <div className="font-medium">{format(hoveredDay.date, 'MMM d, yyyy')}</div>
          <div className="text-muted-foreground">{hoveredDay.count} submission{hoveredDay.count !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
});

export default function DashboardPage() {
  const [stats, setStats] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
    solved: 0,
    ranking: 0,
    weeklyChange: 0,
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);

  useEffect(() => {
    // Fetch Stats
    axios.get('http://localhost:3000/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));

    // Fetch Activity
    axios.get('http://localhost:3000/dashboard/activity')
      .then(res => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRecentActivity(res.data.map((item: any) => ({
          id: item.problemSlug, // Use slug for link
          problem: item.problemTitle,
          status: item.status === 'ACCEPTED' ? 'Solved' : 'Attempted',
          time: format(new Date(item.timestamp), 'MMM d, h:mm a'),
          difficulty: item.difficulty,
          slug: item.problemSlug
        })));
      })
      .catch(err => console.error(err));

    // Fetch Heatmap
    axios.get('http://localhost:3000/dashboard/heatmap')
      .then(res => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHeatmapData(res.data.map((item: any) => ({
          date: new Date(item.date),
          count: item.count
        })));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Demo User</p>
        </header>

        <StatsCard stats={stats} />
        <Heatmap data={heatmapData} />

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-card border border-border p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-full",
                      activity.status === 'Solved' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {activity.status === 'Solved' ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-semibold uppercase tracking-wider",
                          activity.status === 'Solved' ? "text-green-500" : "text-yellow-500"
                        )}>
                          {activity.status}
                        </span>
                        <Link to={`/problems/${activity.slug}`} className="font-medium hover:underline">{activity.problem}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                  <span className={cn(
                    "font-medium",
                    activity.difficulty === 'Easy' && "text-green-500",
                    activity.difficulty === 'Medium' && "text-yellow-500",
                    activity.difficulty === 'Hard' && "text-red-500",
                  )}>{activity.difficulty}</span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
