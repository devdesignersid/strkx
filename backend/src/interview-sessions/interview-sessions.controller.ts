import { Body, Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { InterviewSessionsService } from './interview-sessions.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interview-sessions')
@UseGuards(JwtAuthGuard)
export class InterviewSessionsController {
  constructor(private readonly interviewSessionsService: InterviewSessionsService) {}

  @Post()
  create(@Body() createInterviewSessionDto: CreateInterviewSessionDto, @Req() req) {
    return this.interviewSessionsService.create(createInterviewSessionDto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewSessionsService.findOne(id);
  }

  @Post(':id/questions/:questionId/submit')
  submitAnswer(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() submitDto: SubmitInterviewAnswerDto,
  ) {
    return this.interviewSessionsService.submitAnswer(id, questionId, submitDto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.interviewSessionsService.completeSession(id);
  }

  @Post(':id/abandon')
  abandon(@Param('id') id: string) {
    return this.interviewSessionsService.abandonSession(id);
  }
}
