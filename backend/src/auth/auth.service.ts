import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async validateGoogleUser(profile: any): Promise<User> {
    const { id, emails, photos, displayName } = profile;
    const email = emails[0].value;
    const photoUrl = photos[0].value;

    try {
      let user = await this.prisma.user.findUnique({
        where: { googleId: id },
      });

      if (!user) {
        // Check if user exists with same email but no googleId
        user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link Google account
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: id,
              profilePicture: photoUrl,
              lastLogin: new Date(),
            },
          });
        } else {
          // Create new user
          user = await this.prisma.user.create({
            data: {
              email,
              name: displayName,
              googleId: id,
              profilePicture: photoUrl,
              lastLogin: new Date(),
            },
          });
        }
      } else {
        // Update last login
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            profilePicture: photoUrl, // Update profile picture if changed
          },
        });
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Error validating Google user');
    }
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // For E2E testing bypass
  async validateTestUser(email: string): Promise<User> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('E2E Auth Bypass is DISABLED in production');
    }
    if (process.env.E2E_AUTH_BYPASS !== 'true') {
      throw new Error('E2E Auth Bypass is not enabled');
    }

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: 'Test User',
          googleId: `test-${Date.now()}`,
          lastLogin: new Date(),
        }
      });
    }
    return user;
  }
}
