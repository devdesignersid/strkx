import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) return { solved: 0, attempted: 0, accuracy: 0, streak: 0 };

    const submissions = await this.prisma.submission.findMany({
      where: { userId: user.id },
      select: { status: true, problemId: true, problem: { select: { difficulty: true } }, createdAt: true },
    });

    const solvedProblems = new Set<string>();
    const solvedEasy = new Set<string>();
    const solvedMedium = new Set<string>();
    const solvedHard = new Set<string>();

    // Weekly stats logic
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const solvedThisWeek = new Set<string>();
    const solvedLastWeek = new Set<string>();

    submissions.forEach((s) => {
      if (s.status === 'ACCEPTED') {
        solvedProblems.add(s.problemId);
        if (s.problem.difficulty === 'Easy') solvedEasy.add(s.problemId);
        if (s.problem.difficulty === 'Medium') solvedMedium.add(s.problemId);
        if (s.problem.difficulty === 'Hard') solvedHard.add(s.problemId);

        const submissionDate = new Date(s.createdAt);
        if (submissionDate >= oneWeekAgo) {
          solvedThisWeek.add(s.problemId);
        } else if (submissionDate >= twoWeeksAgo) {
          solvedLastWeek.add(s.problemId);
        }
      }
    });

    // Calculate weekly change percentage
    const currentCount = solvedThisWeek.size;
    const previousCount = solvedLastWeek.size;
    let weeklyChange = 0;

    if (previousCount > 0) {
      weeklyChange = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      weeklyChange = 100; // 100% growth if started from 0
    }

    const attemptedProblems = new Set(submissions.map((s) => s.problemId));

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(
      (s) => s.status === 'ACCEPTED',
    ).length;

    const accuracy =
      totalSubmissions > 0
        ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
        : 0;

    return {
      solved: solvedProblems.size,
      attempted: attemptedProblems.size,
      accuracy,
      streak: 1, // Mock streak for now
      easy: solvedEasy.size,
      medium: solvedMedium.size,
      hard: solvedHard.size,
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
