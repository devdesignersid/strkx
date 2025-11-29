import { Module } from '@nestjs/common';
import { ProblemsModule } from './problems/problems.module';
import { ExecutionModule } from './execution/execution.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ListsModule } from './lists/lists.module';
import { UserModule } from './user/user.module';
import { StudyStatsModule } from './study-stats/study-stats.module';
import { InterviewSessionsModule } from './interview-sessions/interview-sessions.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProblemsModule,
    ExecutionModule,
    DashboardModule,
    ListsModule,

    UserModule,
    StudyStatsModule,
    InterviewSessionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
