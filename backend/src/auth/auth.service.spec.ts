import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { InternalServerErrorException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateGoogleUser', () => {
    const profile = {
      id: 'google123',
      emails: [{ value: 'test@example.com' }],
      photos: [{ value: 'photo.jpg' }],
      displayName: 'Test User',
    };

    it('should return existing user if googleId matches', async () => {
      const existingUser = { id: '1', googleId: 'google123', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValueOnce(existingUser);
      mockPrismaService.user.update.mockResolvedValueOnce(existingUser);

      const result = await service.validateGoogleUser(profile);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { googleId: 'google123' } });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('should link account if email matches but googleId does not', async () => {
      const existingUser = { id: '1', googleId: null, email: 'test@example.com' };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // googleId check
        .mockResolvedValueOnce(existingUser); // email check

      const updatedUser = { ...existingUser, googleId: 'google123' };
      mockPrismaService.user.update.mockResolvedValueOnce(updatedUser);

      const result = await service.validateGoogleUser(profile);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({ googleId: 'google123' }),
      });
      expect(result).toEqual(updatedUser);
    });

    it('should create new user if no match found', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const newUser = { id: '1', googleId: 'google123', email: 'test@example.com' };
      mockPrismaService.user.create.mockResolvedValueOnce(newUser);

      const result = await service.validateGoogleUser(profile);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          googleId: 'google123',
        }),
      });
      expect(result).toEqual(newUser);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(service.validateGoogleUser(profile)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user: any = { id: '1', email: 'test@example.com' };
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: '1', email: 'test@example.com' });
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  describe('validateTestUser', () => {
    it('should throw error if bypass is disabled', async () => {
      process.env.E2E_AUTH_BYPASS = 'false';
      await expect(service.validateTestUser('test@example.com')).rejects.toThrow('E2E Auth Bypass is not enabled');
    });

    it('should return user if bypass is enabled', async () => {
      process.env.E2E_AUTH_BYPASS = 'true';
      const user = { id: '1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateTestUser('test@example.com');
      expect(result).toEqual(user);
    });
  });
});
