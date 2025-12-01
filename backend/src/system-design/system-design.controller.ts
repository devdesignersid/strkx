import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Logger, ParseUUIDPipe } from '@nestjs/common';
import { SystemDesignService } from './system-design.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateSystemDesignProblemDto, UpdateSystemDesignProblemDto } from './dto/create-problem.dto';
import { CreateSystemDesignSubmissionDto, UpdateSystemDesignSubmissionDto, MarkSolutionDto } from './dto/create-submission.dto';

@Controller('system-design')
@UseGuards(OptionalJwtAuthGuard)
export class SystemDesignController {
  private readonly logger = new Logger(SystemDesignController.name);

  constructor(private readonly systemDesignService: SystemDesignService) {}

  @Post('problems')
  async createProblem(@Request() req, @Body() data: CreateSystemDesignProblemDto) {
    let userId = req.user?.id;
    if (!userId) {
      userId = await this.systemDesignService.getDemoUserId();
    }
    return this.systemDesignService.createProblem(userId, data);
  }

  @Get('problems')
  async findAll(@Request() req) {
    let userId = req.user?.id;
    if (!userId) {
      userId = await this.systemDesignService.getDemoUserId();
    }
    return this.systemDesignService.findAll(userId);
  }

  @Get('problems/:id')
  async findOne(@Param('id') id: string) {
    return this.systemDesignService.findOne(id);
  }

  @Post('problems/:id')
  async updateProblem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateSystemDesignProblemDto
  ) {
    return this.systemDesignService.updateProblem(id, data);
  }

  @Post('problems/:id/delete')
  async deleteProblem(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemDesignService.deleteProblem(id);
  }

  @Post('submissions')
  async createSubmission(@Request() req, @Body() body: CreateSystemDesignSubmissionDto) {
    let userId = req.user?.id;

    if (!userId) {
      this.logger.debug('No userId in request, fetching demo user...');
      userId = await this.systemDesignService.getDemoUserId();
    }

    this.logger.log(`Creating submission for userId: ${userId}`);
    return this.systemDesignService.createSubmission({
      ...body,
      user: { connect: { id: userId } },
      problem: { connect: { id: body.problemId } },
    });
  }

  @Post('submissions/:id')
  async updateSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSystemDesignSubmissionDto
  ) {
    return this.systemDesignService.updateSubmission(id, body);
  }

  @Get('problems/:id/submissions')
  async findUserSubmissions(
    @Request() req,
    @Param('id') problemId: string,
    @Query('userId') queryUserId?: string
  ) {
    let userId = req.user?.id || queryUserId;

    if (!userId) {
      this.logger.debug('No userId in request, fetching demo user...');
      userId = await this.systemDesignService.getDemoUserId();
    }

    return this.systemDesignService.findUserSubmissions(userId, problemId);
  }

  @Get('submissions/:id')
  async findSubmission(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemDesignService.findSubmission(id);
  }

  @Post('submissions/:id/analyze')
  async analyzeSubmission(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemDesignService.analyzeSubmission(id);
  }

  @Post('submissions/:id/mark-solution')
  async markSubmissionAsSolution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MarkSolutionDto
  ) {
    return this.systemDesignService.markSubmissionAsSolution(id, body.solutionName);
  }
}
