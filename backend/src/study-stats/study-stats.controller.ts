import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { StudyStatsService } from './study-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('study-stats')
@UseGuards(JwtAuthGuard)
export class StudyStatsController {
  constructor(
    private readonly studyStatsService: StudyStatsService,
  ) {}

  @Post('sync')
  async syncTime(@Body() body: { studySeconds: number }, @Req() req: any) {
    return this.studyStatsService.syncStudyTime(req.user.id, body.studySeconds);
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
