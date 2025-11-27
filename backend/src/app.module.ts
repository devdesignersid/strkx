import { Module } from '@nestjs/common';
import { ProblemsModule } from './problems/problems.module';
import { ExecutionModule } from './execution/execution.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';

import { ListsModule } from './lists/lists.module';

@Module({
  imports: [ProblemsModule, ExecutionModule, PrismaModule, DashboardModule, ListsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
