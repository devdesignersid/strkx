import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getDemoUser() {
    let user = await this.prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
        },
      });
    }

    return user;
  }

  async resetUserData() {
    const user = await this.getDemoUser();

    // Delete ALL data including problems in correct order to respect foreign key constraints
    await this.prisma.$transaction([
      // Delete ProblemsOnLists first (has FK to List and Problem)
      this.prisma.problemsOnLists.deleteMany({}),
      // Delete Lists
      this.prisma.list.deleteMany({
        where: {
          userId: user.id,
        },
      }),
      // Delete Submissions
      this.prisma.submission.deleteMany({
        where: {
          userId: user.id,
        },
      }),
      // Delete TestCases (has FK to Problem)
      this.prisma.testCase.deleteMany({}),
      // Delete all Problems
      this.prisma.problem.deleteMany({}),
    ]);

    return {
      success: true,
      message: 'All data including problems has been reset successfully',
    };
  }
}
