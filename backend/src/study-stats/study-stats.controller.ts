import { Controller, Post, Body, Get, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { StudyStatsService } from './study-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('study-stats')
@UseGuards(JwtAuthGuard)
export class StudyStatsController {
  constructor(
    private readonly studyStatsService: StudyStatsService,
  ) { }

  @Post('sync')
  async syncTime(@Body() body: { duration?: number; studySeconds?: number; timestamp?: string }, @Req() req: any) {
    // Support both 'duration' (new frontend) and 'studySeconds' (legacy)
    const seconds = body.duration ?? body.studySeconds;

    if (seconds === undefined || seconds === null || typeof seconds !== 'number') {
      throw new BadRequestException('duration or studySeconds must be a valid number');
    }

    return this.studyStatsService.syncStudyTime(req.user.id, seconds);
  }

  @Post('reset')
  async resetStats(@Req() req: any) {
    return this.studyStatsService.resetTodayStats(req.user.id);
  }

  @Get('today')
  async getToday(@Req() req: any) {
    return this.studyStatsService.getTodayStats(req.user.id);
  }
}
