import { Module } from '@nestjs/common';
import { ProblemsModule } from './problems/problems.module';
import { ExecutionModule } from './execution/execution.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [ProblemsModule, ExecutionModule, PrismaModule, DashboardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
