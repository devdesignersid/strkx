import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';
import { DASHBOARD_CONSTANTS } from '../common/constants';
import {
  DashboardStatsDto,
  DashboardActivityDto,
  DashboardHeatmapDto,
} from './dashboard.dto';
import {
  getWeeklyDateRanges,
  buildSolvedSubmissionsQuery,
  buildActivityQuery,
  buildSystemDesignActivityQuery,
  buildHeatmapCodingQuery,
  buildHeatmapSystemDesignQuery,
  getAccuracyCounts,
} from './dashboard.utils';

// Cache TTL constants (in milliseconds)
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const HEATMAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getStats(user: any): Promise<DashboardStatsDto> {
    if (!user) {
      return {
        solved: 0,
        attempted: 0,
        accuracy: 0,
        streak: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        weeklyChange: 0,
        systemDesignSolved: 0,
        totalHours: 0,
      };
    }

    // Check cache first
    const cacheKey = `dashboard:stats:${user.id}`;
    const cached = this.cache.get<DashboardStatsDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute all queries in parallel for maximum performance
    const [
      distinctSolved,
      systemDesignSolved,
      attemptedGroup,
      { acceptedCount, totalCount },
      studyStats,
    ] = await Promise.all([
      // Query 1: Distinct solved problems with difficulty and date
      buildSolvedSubmissionsQuery(user.id, this.prisma),

      // Query 2: System design solved count
      this.prisma.systemDesignSubmission.count({
        where: {
          userId: user.id,
          status: 'completed',
        },
      }),

      // Query 3: Attempted problems (distinct)
      this.prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId: user.id },
      }),

      // Query 4: Accuracy counts (total and accepted)
      getAccuracyCounts(user.id, this.prisma),

      // Query 5: Total study time
      this.prisma.dailyStudyLog.aggregate({
        _sum: {
          totalStudySeconds: true,
        },
        where: {
          userId: user.id,
        },
      }),
    ]);

    // Process difficulty breakdown and weekly stats
    let solvedEasy = 0;
    let solvedMedium = 0;
    let solvedHard = 0;
    let solvedThisWeek = 0;
    let solvedLastWeek = 0;

    const { oneWeekAgo, twoWeeksAgo } = getWeeklyDateRanges();

    for (const s of distinctSolved) {
      // Count by difficulty
      if (s.problem.difficulty === 'Easy') solvedEasy++;
      else if (s.problem.difficulty === 'Medium') solvedMedium++;
      else if (s.problem.difficulty === 'Hard') solvedHard++;

      // Count by week
      const date = new Date(s.createdAt);
      if (date >= oneWeekAgo) solvedThisWeek++;
      else if (date >= twoWeeksAgo) solvedLastWeek++;
    }

    const solvedTotal = distinctSolved.length;
    const attempted = attemptedGroup.length;
    const accuracy =
      totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

    // Calculate total hours (round to 1 decimal place)
    const totalSeconds = studyStats._sum.totalStudySeconds || 0;
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // Calculate weekly change
    let weeklyChange = 0;
    if (solvedLastWeek > 0) {
      weeklyChange = Math.round(
        ((solvedThisWeek - solvedLastWeek) / solvedLastWeek) * 100,
      );
    } else if (solvedThisWeek > 0) {
      weeklyChange = 100;
    }

    const result: DashboardStatsDto = {
      solved: solvedTotal,
      attempted,
      accuracy,
      streak: DASHBOARD_CONSTANTS.DEFAULT_STREAK,
      easy: solvedEasy,
      medium: solvedMedium,
      hard: solvedHard,
      weeklyChange,
      systemDesignSolved,
      totalHours,
    };

    // Cache the result
    this.cache.set(cacheKey, result, STATS_CACHE_TTL);

    return result;
  }

  async getActivity(user: any): Promise<DashboardActivityDto[]> {
    if (!user) return [];

    // Check cache first
    const cacheKey = `dashboard:activity:${user.id}`;
    const cached = this.cache.get<DashboardActivityDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute both queries in parallel
    const [codingSubmissions, designSubmissions] = await Promise.all([
      buildActivityQuery(
        user.id,
        DASHBOARD_CONSTANTS.MAX_RECENT_ACTIVITY,
        this.prisma,
      ),
      buildSystemDesignActivityQuery(
        user.id,
        DASHBOARD_CONSTANTS.MAX_RECENT_ACTIVITY,
        this.prisma,
      ),
    ]);

    // Combine and sort
    const combined = [
      ...codingSubmissions.map((s) => ({
        id: s.id,
        problemTitle: s.problem.title,
        problemSlug: s.problem.slug,
        difficulty: s.problem.difficulty,
        status: s.status,
        timestamp: s.createdAt,
        type: 'coding' as const,
      })),
      ...designSubmissions.map((s) => ({
        id: s.id,
        problemTitle: s.problem.title,
        problemSlug: s.problem.id,
        difficulty: s.problem.difficulty,
        status: s.status,
        timestamp: s.createdAt,
        type: 'system-design' as const,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, DASHBOARD_CONSTANTS.MAX_RECENT_ACTIVITY);

    // Cache the result
    this.cache.set(cacheKey, combined, ACTIVITY_CACHE_TTL);

    return combined;
  }

  async getHeatmap(user: any): Promise<DashboardHeatmapDto[]> {
    if (!user) return [];

    // Check cache first
    const cacheKey = `dashboard:heatmap:${user.id}`;
    const cached = this.cache.get<DashboardHeatmapDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute both queries in parallel
    const [submissions, designSubmissions] = await Promise.all([
      buildHeatmapCodingQuery(user.id, this.prisma),
      buildHeatmapSystemDesignQuery(user.id, this.prisma),
    ]);

    const activityMap = new Map<string, Set<string>>();

    // Process coding submissions
    submissions.forEach((s) => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (!activityMap.has(date)) {
        activityMap.set(date, new Set());
      }
      activityMap.get(date)!.add(s.problemId);
    });

    // Process design submissions
    designSubmissions.forEach((s) => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (!activityMap.has(date)) {
        activityMap.set(date, new Set());
      }
      activityMap.get(date)!.add(`design-${s.problemId}`);
    });

    const result = Array.from(activityMap.entries()).map(([date, problems]) => ({
      date,
      count: problems.size,
    }));

    // Cache the result
    this.cache.set(cacheKey, result, HEATMAP_CACHE_TTL);

    return result;
  }

  /**
   * Invalidate cache for a specific user
   * Useful when new submissions are created
   */
  invalidateUserCache(userId: string): void {
    this.cache.invalidatePattern(`dashboard:${userId}`);
  }
}
