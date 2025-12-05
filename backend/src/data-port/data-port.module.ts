import { Module } from '@nestjs/common';
import { DataPortController } from './data-port.controller';
import { ExportService } from './services/export.service';
import { ImportService } from './services/import.service';
import { DuplicateHandler } from './handlers/duplicate.handler';
import { ErrorAggregator } from './handlers/error-aggregator';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
    imports: [PrismaModule, DashboardModule],
    controllers: [DataPortController],
    providers: [
        ExportService,
        ImportService,
        DuplicateHandler,
        ErrorAggregator,
    ],
    exports: [ExportService, ImportService],
})
export class DataPortModule { }
