import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/auth.types';

@Controller('problems')
@UseGuards(JwtAuthGuard)
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) { }

  @Post()
  create(@Body() createProblemDto: CreateProblemDto, @Req() req: AuthenticatedRequest) {
    return this.problemsService.create(createProblemDto, req.user);
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('difficulty') difficulty: string,
    @Query('status') status: string,
    @Query('tags') tags: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.problemsService.findAll(
      paginationDto,
      difficulty,
      status,
      tags,
      req.user,
    );
  }

  @Get(':slug/submissions')
  findSubmissions(@Param('slug') slug: string, @Req() req: AuthenticatedRequest) {
    return this.problemsService.findSubmissions(slug, req.user);
  }

  @Patch(':slug/submissions/:id/solution')
  updateSubmissionSolution(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: { isSolution: boolean; solutionName?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.problemsService.updateSubmissionSolution(
      slug,
      id,
      body.isSolution,
      req.user,
      body.solutionName,
    );
  }

  @Delete(':slug/submissions/:id')
  deleteSubmission(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.problemsService.deleteSubmission(id, req.user.id);
  }

  @Get(':slug/solutions')
  findSolutions(@Param('slug') slug: string, @Req() req: AuthenticatedRequest) {
    return this.problemsService.findSolutions(slug, req.user);
  }

  @Get('id/:id')
  findById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.problemsService.findById(id, req.user.id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Req() req: AuthenticatedRequest) {
    return this.problemsService.findOne(slug, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProblemDto: UpdateProblemDto, @Req() req: AuthenticatedRequest) {
    return this.problemsService.update(id, updateProblemDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.problemsService.remove(id, req.user.id);
  }
}
