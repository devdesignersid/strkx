import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
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
import { SystemDesignModule } from './system-design/system-design.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        } : undefined,
      },
    }),
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
    SystemDesignModule,
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
