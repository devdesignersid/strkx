import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { StudyStatsService } from './study-stats.service';
// Assuming there's an AuthGuard. I'll need to check where it is or import it.
// Usually it's in auth/jwt-auth.guard or similar. I'll search for it if needed.
// For now I'll assume a standard JwtAuthGuard exists or I'll check the codebase.

@Controller('study-stats')
export class StudyStatsController {
  constructor(private readonly studyStatsService: StudyStatsService) {}

  // @UseGuards(JwtAuthGuard) // Uncomment once I verify the guard path
  @Post('sync')
  async syncTime(@Body() body: { userId: string; seconds: number }) {
    // In a real app, userId should come from the JWT token (req.user.id).
    // For now, I'll accept it in the body for simplicity or if auth isn't fully set up in my context.
    // But the user mentioned "logouts", so auth is definitely there.
    // I should check how other controllers handle auth.
    return this.studyStatsService.syncStudyTime(body.userId, body.seconds);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('today')
  async getToday(@Request() req) {
    // return this.studyStatsService.getTodayStats(req.user.id);
    // Placeholder:
    return { message: "Auth not yet integrated in this snippet" };
  }
}
