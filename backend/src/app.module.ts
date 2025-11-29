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
import { CommonModule } from './common/common.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    CommonModule,
    AuthModule,
    ProblemsModule,
    ExecutionModule,
    DashboardModule,
    ListsModule,

    UserModule,
    StudyStatsModule,
    InterviewSessionsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
