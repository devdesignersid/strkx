import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req) {
    return this.dashboardService.getStats(req.user);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard)
  getActivity(@Request() req) {
    return this.dashboardService.getActivity(req.user);
  }

  @Get('heatmap')
  @UseGuards(JwtAuthGuard)
  getHeatmap(@Request() req) {
    return this.dashboardService.getHeatmap(req.user);
  }
}
