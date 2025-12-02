import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ManageListProblemsDto } from './dto/manage-list-problems.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  create(@Body() createListDto: CreateListDto, @Req() req: any) {
    return this.listsService.create(createListDto, req.user);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;
    return this.listsService.findAll(req.user, skip, limitNum, search);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
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
    return this.listsService.findOne(
      id,
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListDto: UpdateListDto, @Req() req: any) {
    return this.listsService.update(id, updateListDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.listsService.remove(id, req.user);
  }

  @Post(':id/problems')
  addProblems(@Param('id') id: string, @Body() dto: ManageListProblemsDto, @Req() req: any) {
    return this.listsService.addProblems(id, dto, req.user);
  }

  @Delete(':id/problems')
  removeProblems(@Param('id') id: string, @Body() dto: ManageListProblemsDto, @Req() req: any) {
    return this.listsService.removeProblems(id, dto, req.user);
  }
}
