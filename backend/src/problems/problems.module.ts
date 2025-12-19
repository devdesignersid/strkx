import { Module } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [ProblemsController],
  providers: [ProblemsService],
})
export class ProblemsModule {}
