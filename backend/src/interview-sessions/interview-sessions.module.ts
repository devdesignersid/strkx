import { Module } from '@nestjs/common';
import { InterviewSessionsController } from './interview-sessions.controller';
import { InterviewSessionsService } from './interview-sessions.service';

@Module({
  controllers: [InterviewSessionsController],
  providers: [InterviewSessionsService]
})
export class InterviewSessionsModule {}
