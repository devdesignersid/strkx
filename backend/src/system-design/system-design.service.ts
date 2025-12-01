import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_DESIGN_CONSTANTS, DEMO_USER_EMAIL } from '../common/constants';
import { CreateSystemDesignProblemDto, UpdateSystemDesignProblemDto } from './dto/create-problem.dto';
import { CreateSystemDesignSubmissionDto, UpdateSystemDesignSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SystemDesignService {
  constructor(private prisma: PrismaService) {}

  async createProblem(userId: string, data: CreateSystemDesignProblemDto) {
    return this.prisma.systemDesignProblem.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async getDemoUserId() {
    const user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });
    return user?.id || 'demo-user';
  }

  async findAll(userId: string) {
    return this.prisma.systemDesignProblem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async findOne(idOrSlug: string) {
    // Check if input is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

    const problem = await this.prisma.systemDesignProblem.findFirst({
      where,
      include: {
        solutions: {
          select: {
            id: true,
            title: true,
            description: true,
            author: true,
            createdAt: true,
            diagramSnapshot: true,
            // Exclude excalidrawJson for list view to improve performance
          },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException(`System Design problem with ID/Slug ${idOrSlug} not found`);
    }

    return problem;
  }

  async updateProblem(id: string, data: UpdateSystemDesignProblemDto) {
    return this.prisma.systemDesignProblem.update({
      where: { id },
      data,
    });
  }

  async deleteProblem(id: string) {
    return this.prisma.systemDesignProblem.delete({
      where: { id },
    });
  }

  // Submissions
  async createSubmission(data: CreateSystemDesignSubmissionDto & { user: { connect: { id: string } }, problem: { connect: { id: string } } }) {
    const { problemId, user, problem, ...rest } = data;
    return this.prisma.systemDesignSubmission.create({
      data: {
        ...rest,
        user,
        problem,
      },
    });
  }

  async updateSubmission(id: string, data: UpdateSystemDesignSubmissionDto) {
    return this.prisma.systemDesignSubmission.update({
      where: { id },
      data,
    });
  }

  async findUserSubmissions(userId: string, idOrSlug: string) {
    let problemId = idOrSlug;

    // Check if input is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    if (!isUuid) {
        const problem = await this.prisma.systemDesignProblem.findFirst({
            where: { slug: idOrSlug },
            select: { id: true }
        });
        if (!problem) {
            throw new NotFoundException(`System Design problem with slug ${idOrSlug} not found`);
        }
        problemId = problem.id;
    }

    return this.prisma.systemDesignSubmission.findMany({
      where: {
        problemId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSubmission(id: string) {
    const submission = await this.prisma.systemDesignSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async analyzeSubmission(id: string) {
    const submission = await this.findSubmission(id);

    // TODO: Integrate with actual AI service (Gemini/OpenAI)
    // For now, return mock analysis based on the problem
    const mockAnalysis = {
      score: SYSTEM_DESIGN_CONSTANTS.DEFAULT_ANALYSIS_SCORE,
      summary: SYSTEM_DESIGN_CONSTANTS.DEFAULT_ANALYSIS_SUMMARY,
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    // Update submission with analysis
    return this.prisma.systemDesignSubmission.update({
      where: { id },
      data: {
        aiAnalysis: mockAnalysis,
        score: mockAnalysis.score,
        feedback: mockAnalysis.summary
      }
    });
  }

  async markSubmissionAsSolution(id: string, solutionName?: string) {
    // Find the submission
    const submission = await this.prisma.systemDesignSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    // Toggle isSolution status
    const updatedSubmission = await this.prisma.systemDesignSubmission.update({
      where: { id },
      data: {
        isSolution: !submission.isSolution,
        solutionName: !submission.isSolution ? (solutionName || null) : null
      },
    });

    // If marking as solution, unmark all other submissions for this problem
    if (updatedSubmission.isSolution) {
      await this.prisma.systemDesignSubmission.updateMany({
        where: {
          problemId: submission.problemId,
          id: { not: id },
        },
        data: { isSolution: false, solutionName: null },
      });
    }

    return updatedSubmission;
  }
}
