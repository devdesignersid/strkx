import { PrismaService } from '../prisma/prisma.service';

/**
 * Calculate date ranges for weekly stats
 */
export function getWeeklyDateRanges() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return { now, oneWeekAgo, twoWeeksAgo };
}

/**
 * Build query for user's solved submissions with difficulty filtering
 */
export function buildSolvedSubmissionsQuery(userId: string, prisma: PrismaService) {
  return prisma.submission.findMany({
    where: {
      userId,
      status: 'ACCEPTED'
    },
    distinct: ['problemId'],
    select: {
      createdAt: true,
      problem: {
        select: { difficulty: true }
      }
    }
  });
}

/**
 * Build query for user's activity submissions (coding)
 */
export function buildActivityQuery(userId: string, limit: number, prisma: PrismaService) {
  return prisma.submission.findMany({
    where: { userId },
    distinct: ['problemId'],
    take: limit,
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
}

/**
 * Build query for user's system design activity
 */
export function buildSystemDesignActivityQuery(userId: string, limit: number, prisma: PrismaService) {
  return prisma.systemDesignSubmission.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      problem: {
        select: { title: true, id: true, difficulty: true }
      }
    }
  });
}

/**
 * Build query for heatmap coding submissions
 */
export function buildHeatmapCodingQuery(userId: string, prisma: PrismaService) {
  return prisma.submission.findMany({
    where: {
      userId,
      status: 'ACCEPTED'
    },
    select: {
      createdAt: true,
      problemId: true
    },
  });
}

/**
 * Build query for heatmap system design submissions
 */
export function buildHeatmapSystemDesignQuery(userId: string, prisma: PrismaService) {
  return prisma.systemDesignSubmission.findMany({
    where: {
      userId,
      status: 'completed'
    },
    select: {
      createdAt: true,
      problemId: true
    }
  });
}

/**
 * Count total and accepted submissions for accuracy
 */
export async function getAccuracyCounts(userId: string, prisma: PrismaService) {
  const [acceptedCount, totalCount] = await Promise.all([
    prisma.submission.count({
      where: { userId, status: 'ACCEPTED' },
    }),
    prisma.submission.count({
      where: { userId },
    }),
  ]);

  return { acceptedCount, totalCount };
}
