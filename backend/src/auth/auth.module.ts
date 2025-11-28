import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.SESSION_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
