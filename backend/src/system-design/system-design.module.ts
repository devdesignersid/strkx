import { Module } from '@nestjs/common';
import { SystemDesignController } from './system-design.controller';
import { SystemDesignService } from './system-design.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [SystemDesignController],
  providers: [SystemDesignService],
  exports: [SystemDesignService],
})
export class SystemDesignModule { }
