import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) { }

  async resetUserData(user: any) {
    // Delete ALL data for this user in correct order to respect foreign key constraints
    await this.prisma.$transaction([
      // 1. Delete Interview Questions (FK to Problem)
      this.prisma.interviewQuestion.deleteMany({
        where: {
          interviewSession: { userId: user.id }
        }
      }),
      // 2. Delete Interview Sessions (FK to User)
      this.prisma.interviewSession.deleteMany({
        where: { userId: user.id }
      }),
      // 3. Delete ProblemsOnLists (FK to List and Problem)
      this.prisma.problemsOnLists.deleteMany({
        where: {
          list: { userId: user.id }
        }
      }),
      // 3.5 Delete SystemDesignProblemsOnLists
      this.prisma.systemDesignProblemsOnLists.deleteMany({
        where: {
          list: { userId: user.id }
        }
      }),
      // 4. Delete Lists (FK to User)
      this.prisma.list.deleteMany({
        where: { userId: user.id },
      }),
      // 5. Delete Submissions (FK to User)
      this.prisma.submission.deleteMany({
        where: { userId: user.id },
      }),
      // 6. Delete TestCases for user's problems (FK to Problem)
      this.prisma.testCase.deleteMany({
        where: {
          problem: { userId: user.id }
        }
      }),
      // 7. Delete System Design Submissions (FK to User/Problem)
      this.prisma.systemDesignSubmission.deleteMany({
        where: { userId: user.id }
      }),
      // 8. Delete System Design Solutions (FK to Problem)
      this.prisma.systemDesignSolution.deleteMany({
        where: {
          problem: { userId: user.id }
        }
      }),
      // 9. Delete System Design Problems (FK to User)
      this.prisma.systemDesignProblem.deleteMany({
        where: { userId: user.id }
      }),
      // 10. Delete Daily Study Logs (FK to User)
      this.prisma.dailyStudyLog.deleteMany({
        where: { userId: user.id }
      }),
      // 11. Delete Problems created by user (FK to User)
      this.prisma.problem.deleteMany({
        where: { userId: user.id }
      }),
    ]);

    // Invalidate dashboard cache for this user (explicit keys)
    this.cacheService.invalidatePattern(`dashboard:stats:${user.id}`);
    this.cacheService.invalidatePattern(`dashboard:activity:${user.id}`);
    this.cacheService.invalidatePattern(`dashboard:heatmap:${user.id}`);

    return {
      success: true,
      message: 'All data including problems has been reset successfully',
    };
  }
}
