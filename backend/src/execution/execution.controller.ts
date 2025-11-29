import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  execute(@Body() executeCodeDto: ExecuteCodeDto, @Request() req) {
    return this.executionService.execute(executeCodeDto, req.user);
  }
}
