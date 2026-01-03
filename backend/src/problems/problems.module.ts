import { Module } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [DashboardModule, ExecutionModule],
  controllers: [ProblemsController],
  providers: [ProblemsService],
})
export class ProblemsModule { }
