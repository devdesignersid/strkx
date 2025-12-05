import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { DriverGenerator } from './driver-generator';

import { HydrationService } from './hydration.service';

import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [ExecutionController],
  providers: [ExecutionService, DriverGenerator, HydrationService],
})
export class ExecutionModule { }
