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
      // 7. Delete Problems created by user (FK to User)
      this.prisma.problem.deleteMany({
        where: { userId: user.id }
      }),
    ]);

    return {
      success: true,
      message: 'All data including problems has been reset successfully',
    };
  }
}
