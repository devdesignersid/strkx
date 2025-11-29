import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';

export class AuthHelper {
  private jwtService: JwtService;

  constructor(private prisma: PrismaClient) {
    this.jwtService = new JwtService({
      secret: process.env.SESSION_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '7d' },
    });
  }

  async createTestUser(email: string = 'test@example.com', name: string = 'Test User'): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        name,
        googleId: Math.random().toString(36).substring(7),
      },
    });
  }

  getAuthCookie(user: User): string {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return `Authentication=${token}; Path=/; HttpOnly`;
  }
}
