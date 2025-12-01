import { Module } from '@nestjs/common';
import { SystemDesignController } from './system-design.controller';
import { SystemDesignService } from './system-design.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemDesignController],
  providers: [SystemDesignService],
  exports: [SystemDesignService],
})
export class SystemDesignModule {}
