import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ManageListProblemsDto } from './dto/manage-list-problems.dto';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  create(@Body() createListDto: CreateListDto) {
    return this.listsService.create(createListDto);
  }

  @Get()
  findAll() {
    return this.listsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.listsService.findOne(id, pageNum, limitNum);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListDto: UpdateListDto) {
    return this.listsService.update(id, updateListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listsService.remove(id);
  }

  @Post(':id/problems')
  addProblems(@Param('id') id: string, @Body() dto: ManageListProblemsDto) {
    return this.listsService.addProblems(id, dto);
  }

  @Delete(':id/problems')
  removeProblems(@Param('id') id: string, @Body() dto: ManageListProblemsDto) {
    return this.listsService.removeProblems(id, dto);
  }
}
