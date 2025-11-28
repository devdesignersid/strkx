import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { StudyStatsService } from './study-stats.service';
import { PrismaService } from '../prisma/prisma.service';
// Assuming there's an AuthGuard. I'll need to check where it is or import it.
// Usually it's in auth/jwt-auth.guard or similar. I'll search for it if needed.
// For now I'll assume a standard JwtAuthGuard exists or I'll check the codebase.

@Controller('study-stats')
export class StudyStatsController {
  constructor(
    private readonly studyStatsService: StudyStatsService,
    private readonly prisma: PrismaService // Inject PrismaService to find user
  ) {}

  @Post('sync')
  async syncTime(@Body() body: { studySeconds: number }) {
    // Hardcoded demo user for now, matching DashboardService
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) {
      return { error: 'Demo user not found' };
    }

    return this.studyStatsService.syncStudyTime(user.id, body.studySeconds);
  }

  @Post('reset')
  async resetStats() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) {
      return { error: 'Demo user not found' };
    }

    return this.studyStatsService.resetTodayStats(user.id);
  }

  @Get('today')
  async getToday() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) {
      return { totalStudySeconds: 0, sessionCount: 0 };
    }

    return this.studyStatsService.getTodayStats(user.id);
  }
}
