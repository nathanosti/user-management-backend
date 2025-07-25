import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { CacheService } from '../../cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtUtil } from '../utils/jwt.util';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

jest.mock('bcrypt');
jest.mock('../utils/jwt.util');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let cacheService: jest.Mocked<CacheService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = User.create({
    id: 'user-id',
    email: 'user@example.com',
    password: 'hashed-password',
    role: Role.MEMBER,
    name: 'Test',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: null,
    birthDate: null,
    avatar: null,
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;

    cacheService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as any;

    jwtService = {
      signAsync: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.accessExpiresIn') return '15m';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return null;
      }),
    } as any;

    (JwtUtil.generateTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access.token',
      refreshToken: 'refresh.token',
    });
    (JwtUtil.encryptToken as jest.Mock).mockImplementation(
      (t) => `encrypted:${t}`,
    );
    (JwtUtil.hashToken as jest.Mock).mockImplementation((t) => `hash:${t}`);
    (JwtUtil.decryptToken as jest.Mock).mockImplementation((t) =>
      t.replace('encrypted:', ''),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: CacheService, useValue: cacheService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should login successfully and return encrypted tokens', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: mockUser.email,
        password: '123456',
      });

      expect(result.accessToken).toBe('encrypted:access.token');
      expect(result.refreshToken).toBe('encrypted:refresh.token');
      expect(cacheService.set).toHaveBeenCalledTimes(2);
    });

    it('should throw if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'x', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new encrypted tokens on valid refresh', async () => {
      const encrypted = 'encrypted:refresh.token';
      cacheService.get.mockResolvedValue('hash:refresh.token');
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.refreshTokens(mockUser.id, encrypted);

      expect(result.accessToken).toBe('encrypted:access.token');
      expect(result.refreshToken).toBe('encrypted:refresh.token');
    });

    it('should throw if refresh token decrypt fails', async () => {
      (JwtUtil.decryptToken as jest.Mock).mockImplementationOnce(() => {
        throw new Error('bad token');
      });

      await expect(
        service.refreshTokens(mockUser.id, 'invalid.token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if refresh token hash mismatch', async () => {
      (JwtUtil.decryptToken as jest.Mock).mockReturnValue('refresh.token');
      cacheService.get.mockResolvedValue(null);

      await expect(
        service.refreshTokens(mockUser.id, 'encrypted:refresh.token'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should delete both access and refresh tokens', async () => {
      await service.logout(mockUser.id);

      expect(cacheService.del).toHaveBeenCalledWith(
        `auth:access:${mockUser.id}`,
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `auth:refresh:${mockUser.id}`,
      );
    });
  });
});
