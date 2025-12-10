import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateVersionDto {
    contentJSON: Prisma.InputJsonValue;
    designJSON: Prisma.InputJsonValue;
    templateId: string;
}


@Injectable()
export class ResumeService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get or create resume for user
     */
    async getOrCreateResume(userId: string) {
        let resume = await this.prisma.resume.findUnique({
            where: { userId },
            include: {
                versions: {
                    take: 1,
                    orderBy: { versionNumber: 'desc' },
                },
            },
        });

        if (!resume) {
            resume = await this.prisma.resume.create({
                data: { userId },
                include: {
                    versions: true,
                },
            });
        }

        return resume;
    }

    /**
     * Get resume with latest version
     */
    async getResume(userId: string) {
        const resume = await this.prisma.resume.findUnique({
            where: { userId },
            include: {
                versions: {
                    take: 1,
                    orderBy: { versionNumber: 'desc' },
                },
            },
        });

        return resume;
    }

    /**
     * Create a new version (atomic operation)
     */
    async createVersion(userId: string, data: CreateVersionDto) {
        // Use transaction to ensure atomic version increment
        return this.prisma.$transaction(async (tx) => {
            // Get or create resume
            let resume = await tx.resume.findUnique({
                where: { userId },
            });

            if (!resume) {
                resume = await tx.resume.create({
                    data: { userId },
                });
            }

            const newVersionNumber = resume.latestVersionNumber + 1;

            // Create new version
            const version = await tx.resumeVersion.create({
                data: {
                    resumeId: resume.id,
                    versionNumber: newVersionNumber,
                    contentJSON: data.contentJSON,
                    designJSON: data.designJSON,
                    templateId: data.templateId,
                },
            });

            // Update latest version number
            await tx.resume.update({
                where: { id: resume.id },
                data: { latestVersionNumber: newVersionNumber },
            });

            return version;
        });
    }

    /**
     * Get all versions for a user's resume
     */
    async getVersions(userId: string) {
        const resume = await this.prisma.resume.findUnique({
            where: { userId },
        });

        if (!resume) {
            return [];
        }

        return this.prisma.resumeVersion.findMany({
            where: { resumeId: resume.id },
            orderBy: { versionNumber: 'desc' },
            select: {
                id: true,
                versionNumber: true,
                templateId: true,
                createdAt: true,
            },
        });
    }

    /**
     * Get a specific version by version number
     */
    async getVersion(userId: string, versionNumber: number) {
        const resume = await this.prisma.resume.findUnique({
            where: { userId },
        });

        if (!resume) {
            return null;
        }

        return this.prisma.resumeVersion.findUnique({
            where: {
                resumeId_versionNumber: {
                    resumeId: resume.id,
                    versionNumber,
                },
            },
        });
    }

    /**
     * Delete the latest version (stack behavior)
     */
    async deleteLatestVersion(userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const resume = await tx.resume.findUnique({
                where: { userId },
            });

            if (!resume || resume.latestVersionNumber === 0) {
                return { deleted: false, message: 'No versions to delete' };
            }

            // Delete the latest version
            await tx.resumeVersion.delete({
                where: {
                    resumeId_versionNumber: {
                        resumeId: resume.id,
                        versionNumber: resume.latestVersionNumber,
                    },
                },
            });

            // Decrement the latest version number
            await tx.resume.update({
                where: { id: resume.id },
                data: { latestVersionNumber: resume.latestVersionNumber - 1 },
            });

            return {
                deleted: true,
                newLatestVersionNumber: resume.latestVersionNumber - 1
            };
        });
    }
}
