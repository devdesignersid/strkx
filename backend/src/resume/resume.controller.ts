import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    NotFoundException,
    BadRequestException,
    Req,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/auth.types';
import { Prisma } from '@prisma/client';

interface CreateVersionDto {
    contentJSON: Prisma.InputJsonValue;
    designJSON: Prisma.InputJsonValue;
    templateId: string;
}

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) { }

    /**
     * GET /resume
     * Get user's resume with latest version
     */
    @Get()
    async getResume(@Req() req: AuthenticatedRequest) {
        const resume = await this.resumeService.getOrCreateResume(req.user.id);
        return resume;
    }

    /**
     * POST /resume/version
     * Create a new version with validation
     */
    @Post('version')
    async createVersion(
        @Req() req: AuthenticatedRequest,
        @Body() createVersionDto: CreateVersionDto,
    ) {
        // Validate required fields
        if (!createVersionDto.contentJSON) {
            throw new BadRequestException('contentJSON is required');
        }
        if (!createVersionDto.designJSON) {
            throw new BadRequestException('designJSON is required');
        }
        if (!createVersionDto.templateId || typeof createVersionDto.templateId !== 'string') {
            throw new BadRequestException('templateId is required and must be a string');
        }

        // Validate content is not empty object
        const content = createVersionDto.contentJSON as Record<string, unknown>;
        if (typeof content !== 'object' || Object.keys(content).length === 0) {
            throw new BadRequestException('contentJSON cannot be empty');
        }

        // Validate design is not empty object
        const design = createVersionDto.designJSON as Record<string, unknown>;
        if (typeof design !== 'object' || Object.keys(design).length === 0) {
            throw new BadRequestException('designJSON cannot be empty');
        }

        const version = await this.resumeService.createVersion(
            req.user.id,
            createVersionDto,
        );
        return version;
    }

    /**
     * GET /resume/versions
     * Get all versions for user's resume
     */
    @Get('versions')
    async getVersions(@Req() req: AuthenticatedRequest) {
        const versions = await this.resumeService.getVersions(req.user.id);
        return versions;
    }

    /**
     * GET /resume/version/:versionNumber
     * Get a specific version by version number
     */
    @Get('version/:versionNumber')
    async getVersion(
        @Req() req: AuthenticatedRequest,
        @Param('versionNumber', ParseIntPipe) versionNumber: number,
    ) {
        if (versionNumber < 1) {
            throw new BadRequestException('Version number must be at least 1');
        }
        const version = await this.resumeService.getVersion(req.user.id, versionNumber);
        if (!version) {
            throw new NotFoundException(`Version ${versionNumber} not found`);
        }
        return version;
    }

    /**
     * DELETE /resume/version/latest
     * Delete the latest version (stack behavior)
     */
    @Delete('version/latest')
    async deleteLatestVersion(@Req() req: AuthenticatedRequest) {
        const result = await this.resumeService.deleteLatestVersion(req.user.id);
        return result;
    }
}
