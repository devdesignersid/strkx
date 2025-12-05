import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const callbackURL = process.env.AUTH_REDIRECT_URL || 'http://localhost:3000/auth/google/callback';
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Add 5s timeout
      const user = await Promise.race([
        this.authService.validateGoogleUser(profile),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Google validation timed out')), 5000)
        ),
      ]);
      done(null, user as any);
    } catch (error) {
      done(error, false);
    }
  }
}
