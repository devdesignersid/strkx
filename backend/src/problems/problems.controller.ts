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
import { UpdateProblemDto } from './dto/update-problem.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('problems')
@UseGuards(JwtAuthGuard)
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  create(@Body() createProblemDto: CreateProblemDto, @Req() req: any) {
    return this.problemsService.create(createProblemDto, req.user);
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('difficulty') difficulty: string,
    @Query('status') status: string,
    @Query('tags') tags: string,
    @Query('sort') sort: string,
    @Query('order') order: 'asc' | 'desc',
    @Req() req: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.problemsService.findAll(
      pageNum,
      limitNum,
      search,
      difficulty,
      status,
      tags,
      sort,
      order,
      req.user,
    );
  }

  @Get(':slug/submissions')
  findSubmissions(@Param('slug') slug: string, @Req() req: any) {
    return this.problemsService.findSubmissions(slug, req.user);
  }

  @Patch(':slug/submissions/:id/solution')
  updateSubmissionSolution(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: { isSolution: boolean; solutionName?: string },
  ) {
    return this.problemsService.updateSubmissionSolution(
      slug,
      id,
      body.isSolution,
      body.solutionName,
    );
  }

  @Get(':slug/solutions')
  findSolutions(@Param('slug') slug: string, @Req() req: any) {
    return this.problemsService.findSolutions(slug, req.user);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Req() req: any) {
    return this.problemsService.findOne(slug, req.user.id);
  }

  @Get('id/:id')
  findById(@Param('id') id: string, @Req() req: any) {
    return this.problemsService.findById(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProblemDto: UpdateProblemDto, @Req() req: any) {
    return this.problemsService.update(id, updateProblemDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.problemsService.remove(id, req.user.id);
  }
}
