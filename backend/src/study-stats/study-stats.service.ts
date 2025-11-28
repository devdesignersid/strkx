import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudyStatsService {
  constructor(private prisma: PrismaService) {}

  async syncStudyTime(userId: string, secondsToAdd: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.dailyStudyLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        totalStudySeconds: {
          increment: secondsToAdd,
        },
        sessionCount: {
          increment: 1, // Increment session count on each sync batch? Or maybe just once per "session"?
                        // For now, let's assume client handles session definition or we just count syncs as activity.
                        // Actually, better to just increment seconds. Session count might be better handled by explicit start/stop.
                        // Let's just increment seconds for now.
        },
      },
      create: {
        userId,
        date: today,
        totalStudySeconds: secondsToAdd,
        sessionCount: 1,
      },
    });
  }

  async getTodayStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await this.prisma.dailyStudyLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return log || { totalStudySeconds: 0, sessionCount: 0 };
  }
}
