import {
    Controller,
    Post,
    Body,
    Res,
    UseGuards,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Req,
} from '@nestjs/common';
import { Response } from 'express';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from './services/export.service';
import { ImportService } from './services/import.service';
import { ExportOptionsDto } from './dto/export.dto';
import { ImportOptionsDto, ImportResultDto, ImportPreviewDto } from './dto/import.dto';
import { IMPORT_LIMITS } from './validators/schemas';

/**
 * DataPortController
 * 
 * REST endpoints for data export and import functionality.
 */
@Controller('data-port')
@UseGuards(JwtAuthGuard)
export class DataPortController {
    constructor(
        private readonly exportService: ExportService,
        private readonly importService: ImportService,
    ) { }

    /**
     * Export user data as JSON file
     */
    @Post('export')
    async exportData(
        @Body() options: ExportOptionsDto,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const data = await this.exportService.exportData(req.user.id, options);
        const json = this.exportService.formatAsJson(data);
        const filename = this.exportService.generateFilename();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(HttpStatus.OK).send(json);
    }

    /**
     * Export as inline JSON (for preview/testing)
     */
    @Post('export/preview')
    async exportPreview(
        @Body() options: ExportOptionsDto,
        @Req() req: any,
    ): Promise<{ data: any; filename: string }> {
        const data = await this.exportService.exportData(req.user.id, options);
        const filename = this.exportService.generateFilename();
        return { data, filename };
    }

    /**
     * Preview import without actually importing
     */
    @Post('import/preview')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: IMPORT_LIMITS.MAX_FILE_SIZE_BYTES },
        }),
    )
    async previewImport(
        @UploadedFile() file: Express.Multer.File,
        @Body('data') dataString?: string,
    ): Promise<ImportPreviewDto> {
        let data: unknown;

        if (file) {
            // Parse uploaded file
            try {
                const content = file.buffer.toString('utf-8');
                data = JSON.parse(content);
            } catch (e) {
                throw new BadRequestException('Invalid JSON file');
            }
        } else if (dataString) {
            // Parse data from body
            try {
                data = JSON.parse(dataString);
            } catch (e) {
                throw new BadRequestException('Invalid JSON data');
            }
        } else {
            throw new BadRequestException('No file or data provided');
        }

        return this.importService.previewImport(data);
    }

    /**
     * Import data from JSON
     */
    @Post('import')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: IMPORT_LIMITS.MAX_FILE_SIZE_BYTES },
        }),
    )
    async importData(
        @UploadedFile() file: Express.Multer.File,
        @Body('options') optionsString: string,
        @Body('data') dataString: string,
        @Req() req: any,
    ): Promise<ImportResultDto> {
        // Parse options
        let options: ImportOptionsDto = {};
        if (optionsString) {
            try {
                options = JSON.parse(optionsString);
            } catch (e) {
                throw new BadRequestException('Invalid options JSON');
            }
        }

        // Parse data
        let data: unknown;
        if (file) {
            try {
                const content = file.buffer.toString('utf-8');
                data = JSON.parse(content);
            } catch (e) {
                throw new BadRequestException('Invalid JSON file');
            }
        } else if (dataString) {
            try {
                data = JSON.parse(dataString);
            } catch (e) {
                throw new BadRequestException('Invalid JSON data');
            }
        } else {
            throw new BadRequestException('No file or data provided');
        }

        return this.importService.importData(req.user.id, data, options);
    }

    /**
     * Resolve duplicates after initial import returned ASK mode
     */
    @Post('import/resolve')
    async resolveImport(
        @Body() body: { data: unknown; options: ImportOptionsDto },
        @Req() req: any,
    ): Promise<ImportResultDto> {
        if (!body.data) {
            throw new BadRequestException('Import data is required');
        }
        if (!body.options?.duplicateResolutions) {
            throw new BadRequestException('Duplicate resolutions are required');
        }

        return this.importService.importData(req.user.id, body.data, body.options);
    }
}
