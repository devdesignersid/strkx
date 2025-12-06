import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LinkPreviewService } from './link-preview.service';

@Controller('link-preview')
export class LinkPreviewController {
    constructor(private readonly linkPreviewService: LinkPreviewService) { }

    @Get()
    async getPreview(@Query('url') url: string) {
        if (!url) {
            throw new BadRequestException('URL is required');
        }

        try {
            const preview = await this.linkPreviewService.fetchPreview(url);
            return { success: true, data: preview };
        } catch (error) {
            return { success: false, data: null, error: 'Failed to fetch preview' };
        }
    }
}
