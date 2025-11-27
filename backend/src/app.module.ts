import { Module } from '@nestjs/common';
import { ProblemsModule } from './problems/problems.module';
import { ExecutionModule } from './execution/execution.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ListsModule } from './lists/lists.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PrismaModule,
    ProblemsModule,
    ExecutionModule,
    DashboardModule,
    ListsModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
