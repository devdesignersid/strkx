import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DASHBOARD_CONSTANTS } from '../common/constants';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: any) {
    if (!user) return { solved: 0, attempted: 0, accuracy: 0, streak: 0, easy: 0, medium: 0, hard: 0, weeklyChange: 0, systemDesignSolved: 0 };

    // 1. Get Solved Counts by Difficulty (Optimized with groupBy)
    const solvedCounts = await this.prisma.submission.groupBy({
      by: ['problemId'],
      where: { userId: user.id, status: 'ACCEPTED' },
    });

    // To get difficulty breakdown, we still need to join with Problem.
    // Prisma groupBy doesn't support relation filtering/selection directly in the same query easily for this shape.
    // However, we can fetch the problem IDs and then count.
    // OR, since we need distinct problemIds, we can fetch them.

    // Better approach for difficulty breakdown + distinct:
    // Fetch all distinct solved submissions with difficulty.
    const distinctSolved = await this.prisma.submission.findMany({
      where: { userId: user.id, status: 'ACCEPTED' },
      distinct: ['problemId'],
      select: {
        createdAt: true,
        problem: {
          select: { difficulty: true }
        }
      }
    });

    let solvedEasy = 0;
    let solvedMedium = 0;
    let solvedHard = 0;
    let solvedThisWeek = 0;
    let solvedLastWeek = 0;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (const s of distinctSolved) {
      if (s.problem.difficulty === 'Easy') solvedEasy++;
      else if (s.problem.difficulty === 'Medium') solvedMedium++;
      else if (s.problem.difficulty === 'Hard') solvedHard++;

      const date = new Date(s.createdAt);
      if (date >= oneWeekAgo) solvedThisWeek++;
      else if (date >= twoWeeksAgo) solvedLastWeek++;
    }

    const solvedTotal = distinctSolved.length;

    // 2. System Design Stats (Count is efficient)
    const systemDesignSolved = await this.prisma.systemDesignSubmission.count({
        where: {
            userId: user.id,
            status: 'completed'
        }
    });

    // 3. Attempted (Distinct problemId)
    // Using groupBy to get distinct count is efficient
    const attemptedGroup = await this.prisma.submission.groupBy({
      by: ['problemId'],
      where: { userId: user.id },
    });
    const attempted = attemptedGroup.length;

    // 4. Accuracy
    // Total accepted submissions (not distinct problems)
    const acceptedCount = await this.prisma.submission.count({
      where: { userId: user.id, status: 'ACCEPTED' },
    });

    // Total submissions
    const totalSubmissions = await this.prisma.submission.count({
      where: { userId: user.id },
    });

    const accuracy = totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

    // Weekly Change
    let weeklyChange = 0;
    if (solvedLastWeek > 0) {
      weeklyChange = Math.round(((solvedThisWeek - solvedLastWeek) / solvedLastWeek) * 100);
    } else if (solvedThisWeek > 0) {
      weeklyChange = 100;
    }

    return {
      solved: solvedTotal,
      attempted,
      accuracy,
      streak: DASHBOARD_CONSTANTS.DEFAULT_STREAK,
      easy: solvedEasy,
      medium: solvedMedium,
      hard: solvedHard,
      weeklyChange,
      systemDesignSolved,
    };
  }

  async getActivity(user: any) {
    if (!user) return [];

    // Fetch coding submissions (Optimized select)
    const codingSubmissions = await this.prisma.submission.findMany({
      where: { userId: user.id },
      distinct: ['problemId'],
      take: DASHBOARD_CONSTANTS.MAX_RECENT_ACTIVITY,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        problem: {
          select: { title: true, slug: true, difficulty: true }
        }
      }
    });

    // Fetch system design submissions (Optimized select)
    const designSubmissions = await this.prisma.systemDesignSubmission.findMany({
        where: { userId: user.id },
        take: DASHBOARD_CONSTANTS.MAX_RECENT_ACTIVITY,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          problem: {
            select: { title: true, id: true }
          }
        }
    });

    // Combine and sort
    const combined = [
        ...codingSubmissions.map(s => ({
            id: s.id,
            problemTitle: s.problem.title,
            problemSlug: s.problem.slug,
            difficulty: s.problem.difficulty,
            status: s.status,
            timestamp: s.createdAt,
            type: 'coding'
        })),
        ...designSubmissions.map(s => ({
            id: s.id,
            problemTitle: s.problem.title,
            problemSlug: s.problem.id,
            difficulty: 'System Design',
            status: s.status,
            timestamp: s.createdAt,
            type: 'system-design'
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, DASHBOARD_CONSTANTS.MAX_RECENT_ACTIVITY);

    return combined;
  }

  async getHeatmap(user: any) {
    if (!user) return [];

    // Coding submissions (Optimized select)
    const submissions = await this.prisma.submission.findMany({
      where: {
        userId: user.id,
        status: 'ACCEPTED'
      },
      select: {
        createdAt: true,
        problemId: true
      },
    });

    // System Design submissions (Optimized select)
    const designSubmissions = await this.prisma.systemDesignSubmission.findMany({
        where: {
            userId: user.id,
            status: 'completed'
        },
        select: {
            createdAt: true,
            problemId: true
        }
    });

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

    return Array.from(activityMap.entries()).map(([date, problems]) => ({
      date,
      count: problems.size,
    }));
  }
}
