import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) return { solved: 0, attempted: 0, accuracy: 0, streak: 0, easy: 0, medium: 0, hard: 0, weeklyChange: 0 };

    // 1. Get unique solved problems count by difficulty (Optimized)
    // We group by problemId to get unique solved problems, then filter by difficulty
    // Since Prisma doesn't support "count distinct problemId where status=ACCEPTED group by difficulty" easily in one go without raw query,
    // we will use a slightly different approach:
    // Fetch all unique accepted problemIds with their difficulty.
    // This is still much lighter than fetching all submissions.

    const distinctSolved = await this.prisma.submission.findMany({
      where: { userId: user.id, status: 'ACCEPTED' },
      distinct: ['problemId'],
      select: { problem: { select: { difficulty: true } }, createdAt: true },
    });

    let solvedEasy = 0;
    let solvedMedium = 0;
    let solvedHard = 0;

    // Weekly stats logic (on distinct solved problems)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let solvedThisWeek = 0;
    let solvedLastWeek = 0;

    for (const s of distinctSolved) {
      if (s.problem.difficulty === 'Easy') solvedEasy++;
      else if (s.problem.difficulty === 'Medium') solvedMedium++;
      else if (s.problem.difficulty === 'Hard') solvedHard++;

      const date = new Date(s.createdAt);
      if (date >= oneWeekAgo) solvedThisWeek++;
      else if (date >= twoWeeksAgo) solvedLastWeek++;
    }

    const solvedTotal = distinctSolved.length;

    // 2. Get total attempted (distinct problemId)
    // We can use groupBy for this
    const attemptedGroup = await this.prisma.submission.groupBy({
      by: ['problemId'],
      where: { userId: user.id },
    });
    const attempted = attemptedGroup.length;

    // 3. Get Accuracy (Total Accepted / Total Submissions)
    // We can use aggregate for total counts
    const aggregations = await this.prisma.submission.aggregate({
      where: { userId: user.id },
      _count: {
        id: true, // Total submissions
      },
    });

    const totalSubmissions = aggregations._count.id;

    // For accepted submissions count (not distinct problems, but total accepted submissions)
    const acceptedCount = await this.prisma.submission.count({
      where: { userId: user.id, status: 'ACCEPTED' },
    });

    const accuracy = totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

    // Calculate weekly change
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
      streak: 1, // Mock streak for now
      easy: solvedEasy,
      medium: solvedMedium,
      hard: solvedHard,
      weeklyChange,
    };
  }

  async getActivity() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) return [];

    const submissions = await this.prisma.submission.findMany({
      where: { userId: user.id },
      distinct: ['problemId'],
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { problem: { select: { title: true, slug: true, difficulty: true } } },
    });

    return submissions.map((s) => ({
      id: s.id,
      problemTitle: s.problem.title,
      problemSlug: s.problem.slug,
      difficulty: s.problem.difficulty,
      status: s.status,
      timestamp: s.createdAt,
    }));
  }

  async getHeatmap() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) return [];

    const submissions = await this.prisma.submission.findMany({
      where: {
        userId: user.id,
        status: 'ACCEPTED' // Only count successful submissions
      },
      select: {
        createdAt: true,
        problemId: true
      },
    });

    const activityMap = new Map<string, Set<string>>();

    submissions.forEach((s) => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (!activityMap.has(date)) {
        activityMap.set(date, new Set());
      }
      activityMap.get(date)!.add(s.problemId);
    });

    return Array.from(activityMap.entries()).map(([date, problems]) => ({
      date,
      count: problems.size,
    }));
  }
}
