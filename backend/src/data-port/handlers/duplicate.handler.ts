import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DuplicateInfo, DuplicateResolution } from '../dto/import.dto';
import { ValidatedExportData } from '../validators/schemas';

/**
 * DuplicateHandler
 * 
 * Detects duplicates by comparing slugs and handles resolution modes.
 */
@Injectable()
export class DuplicateHandler {
    constructor(private prisma: PrismaService) { }

    /**
     * Detect all duplicates in the import data
     */
    async detectAll(
        userId: string,
        data: ValidatedExportData
    ): Promise<DuplicateInfo[]> {
        const duplicates: DuplicateInfo[] = [];

        // Check coding problems
        if (data.codingProblems && data.codingProblems.length > 0) {
            const codingDuplicates = await this.detectCodingProblemDuplicates(
                userId,
                data.codingProblems
            );
            duplicates.push(...codingDuplicates);
        }

        // Check system design problems
        if (data.systemDesignProblems && data.systemDesignProblems.length > 0) {
            const sdDuplicates = await this.detectSystemDesignProblemDuplicates(
                userId,
                data.systemDesignProblems
            );
            duplicates.push(...sdDuplicates);
        }

        // Check lists
        if (data.lists && data.lists.length > 0) {
            const listDuplicates = await this.detectListDuplicates(userId, data.lists);
            duplicates.push(...listDuplicates);
        }

        return duplicates;
    }

    /**
     * Detect duplicate coding problems by slug
     */
    private async detectCodingProblemDuplicates(
        userId: string,
        problems: ValidatedExportData['codingProblems']
    ): Promise<DuplicateInfo[]> {
        const duplicates: DuplicateInfo[] = [];
        const slugs = problems.map(p => p.slug);

        const existingProblems = await this.prisma.problem.findMany({
            where: {
                userId,
                slug: { in: slugs },
            },
            select: {
                id: true,
                slug: true,
                title: true,
            },
        });

        const existingMap = new Map(existingProblems.map(p => [p.slug, p]));

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const existing = existingMap.get(problem.slug);
            if (existing) {
                duplicates.push({
                    itemType: 'codingProblem',
                    existingId: existing.id,
                    existingSlug: existing.slug,
                    existingTitle: existing.title,
                    incomingIndex: i,
                    incomingSlug: problem.slug,
                    incomingTitle: problem.title,
                });
            }
        }

        return duplicates;
    }

    /**
     * Detect duplicate system design problems by slug
     */
    private async detectSystemDesignProblemDuplicates(
        userId: string,
        problems: ValidatedExportData['systemDesignProblems']
    ): Promise<DuplicateInfo[]> {
        const duplicates: DuplicateInfo[] = [];
        const slugs = problems.map(p => p.slug);

        const existingProblems = await this.prisma.systemDesignProblem.findMany({
            where: {
                userId,
                slug: { in: slugs },
            },
            select: {
                id: true,
                slug: true,
                title: true,
            },
        });

        const existingMap = new Map(existingProblems.map(p => [p.slug, p]));

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const existing = existingMap.get(problem.slug);
            if (existing) {
                duplicates.push({
                    itemType: 'systemDesignProblem',
                    existingId: existing.id,
                    existingSlug: existing.slug,
                    existingTitle: existing.title,
                    incomingIndex: i,
                    incomingSlug: problem.slug,
                    incomingTitle: problem.title,
                });
            }
        }

        return duplicates;
    }

    /**
     * Detect duplicate lists by name
     */
    private async detectListDuplicates(
        userId: string,
        lists: ValidatedExportData['lists']
    ): Promise<DuplicateInfo[]> {
        const duplicates: DuplicateInfo[] = [];
        const names = lists.map(l => l.name);

        const existingLists = await this.prisma.list.findMany({
            where: {
                userId,
                name: { in: names },
            },
            select: {
                id: true,
                name: true,
            },
        });

        const existingMap = new Map(existingLists.map(l => [l.name, l]));

        for (let i = 0; i < lists.length; i++) {
            const list = lists[i];
            const existing = existingMap.get(list.name);
            if (existing) {
                duplicates.push({
                    itemType: 'list',
                    existingId: existing.id,
                    existingSlug: existing.name, // Lists use name as identifier
                    existingTitle: existing.name,
                    incomingIndex: i,
                    incomingSlug: list.name,
                    incomingTitle: list.name,
                });
            }
        }

        return duplicates;
    }

    /**
     * Check if an item should be skipped based on duplicates and resolution mode
     */
    shouldSkip(
        itemType: DuplicateInfo['itemType'],
        slug: string,
        duplicates: DuplicateInfo[],
        resolutions?: DuplicateResolution[]
    ): boolean {
        const isDuplicate = duplicates.some(
            d => d.itemType === itemType && d.incomingSlug === slug
        );

        if (!isDuplicate) {
            return false;
        }

        // Check if there's a specific resolution
        if (resolutions) {
            const resolution = resolutions.find(
                r => r.itemType === itemType && r.slug === slug
            );
            if (resolution) {
                return resolution.action === 'skip';
            }
        }

        // Default: skip duplicates when no resolution specified
        return true;
    }

    /**
     * Check if a duplicate should be overwritten
     */
    shouldOverwrite(
        itemType: DuplicateInfo['itemType'],
        slug: string,
        duplicates: DuplicateInfo[],
        resolutions?: DuplicateResolution[]
    ): boolean {
        const isDuplicate = duplicates.some(
            d => d.itemType === itemType && d.incomingSlug === slug
        );

        if (!isDuplicate) {
            return false;
        }

        // Check if there's a specific resolution
        if (resolutions) {
            const resolution = resolutions.find(
                r => r.itemType === itemType && r.slug === slug
            );
            if (resolution) {
                return resolution.action === 'overwrite';
            }
        }

        return false;
    }

    /**
     * Get the existing ID for a duplicate item
     */
    getExistingId(
        itemType: DuplicateInfo['itemType'],
        slug: string,
        duplicates: DuplicateInfo[]
    ): string | null {
        const duplicate = duplicates.find(
            d => d.itemType === itemType && d.incomingSlug === slug
        );
        return duplicate?.existingId || null;
    }
}
