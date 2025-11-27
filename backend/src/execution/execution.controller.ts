import { Controller, Post, Body } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';

@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  execute(@Body() executeCodeDto: ExecuteCodeDto) {
    return this.executionService.execute(executeCodeDto);
  }
}
