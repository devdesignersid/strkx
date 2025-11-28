import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InterviewSessionsService } from './interview-sessions.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto';

@Controller('interview-sessions')
export class InterviewSessionsController {
  constructor(private readonly interviewSessionsService: InterviewSessionsService) {}

  @Post()
  create(@Body() createInterviewSessionDto: CreateInterviewSessionDto) {
    return this.interviewSessionsService.create(createInterviewSessionDto);
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
}
