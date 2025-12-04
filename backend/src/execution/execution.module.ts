import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { DriverGenerator } from './driver-generator';

@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService, DriverGenerator],
})
export class ExecutionModule { }
