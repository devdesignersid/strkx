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
          increment: 1,
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

  async resetTodayStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.dailyStudyLog.update({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      data: {
        totalStudySeconds: 0,
        sessionCount: 0,
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
