import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockReq = {
    cookies: {
      userId: 'user-123',
      refreshToken: 'mock-refresh-token',
    },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login and set cookies', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: '123456',
      };

      const resultMock = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(resultMock);

      const response = await controller.login(dto, mockRes);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'accessToken',
        resultMock.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        resultMock.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(response).toEqual({ message: 'Login successful' });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and set cookies', async () => {
      const resultMock = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(resultMock);

      const response = await controller.refresh(mockReq, mockRes);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'user-123',
        'mock-refresh-token',
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'accessToken',
        resultMock.accessToken,
        expect.any(Object),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        resultMock.refreshToken,
        expect.any(Object),
      );
      expect(response).toEqual({ message: 'Token refreshed' });
    });
  });

  describe('logout', () => {
    it('should logout and clear cookies', async () => {
      const currentUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'MEMBER',
      } as const;

      const response = await controller.logout(currentUser, mockRes);

      expect(authService.logout).toHaveBeenCalledWith('user-123');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(response).toEqual({ message: 'Logged out' });
    });
  });
});
