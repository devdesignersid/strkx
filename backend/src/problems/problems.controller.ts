import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemsService.create(createProblemDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: string,
    @Query('status') status?: string,
    @Query('tags') tags?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
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
    );
  }

  @Get(':slug/submissions')
  findSubmissions(@Param('slug') slug: string) {
    return this.problemsService.findSubmissions(slug);
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
  findSolutions(@Param('slug') slug: string) {
    return this.problemsService.findSolutions(slug);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.problemsService.findOne(slug);
  }

  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.problemsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProblemDto: UpdateProblemDto) {
    return this.problemsService.update(id, updateProblemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.problemsService.remove(id);
  }
}
