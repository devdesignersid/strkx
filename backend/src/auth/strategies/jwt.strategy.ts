import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error('CRITICAL: SESSION_SECRET environment variable must be set.');
    }
    if (secret.length < 32) {
      throw new Error('CRITICAL: SESSION_SECRET must be at least 32 characters for security.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try cookie first (Chrome)
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
        // Fall back to Authorization header (Safari with localStorage)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
