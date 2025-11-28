import { Module } from '@nestjs/common';
import { StudyStatsService } from './study-stats.service';
import { StudyStatsController } from './study-stats.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudyStatsController],
  providers: [StudyStatsService],
})
export class StudyStatsModule {}
