import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/services/users.service';
import { CacheService } from 'src/modules/cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { JwtUtil } from '../utils/jwt.util';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
    private readonly config: ConfigService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiresIn =
      this.config.get<string>('jwt.accessExpiresIn') || '15m';
    const refreshExpiresIn =
      this.config.get<string>('jwt.refreshExpiresIn') || '7d';

    const { accessToken, refreshToken } = await JwtUtil.generateTokens(
      this.jwt,
      payload,
      accessExpiresIn,
      refreshExpiresIn,
    );

    const encryptedAccessToken = JwtUtil.encryptToken(accessToken);
    const encryptedRefreshToken = JwtUtil.encryptToken(refreshToken);

    await this.cacheService.set(
      `auth:access:${user.id}`,
      encryptedAccessToken,
      this.ms(accessExpiresIn),
    );

    await this.cacheService.set(
      `auth:refresh:${user.id}`,
      encryptedRefreshToken,
      this.ms(refreshExpiresIn),
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const encrypted = JwtUtil.encryptToken(refreshToken);
    const stored = await this.cacheService.get(`auth:refresh:${userId}`);

    if (!stored || stored !== encrypted) {
      throw new ForbiddenException('INVALID_REFRESH_TOKEN');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('USER_NOT_FOUND');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiresIn =
      this.config.get<string>('jwt.accessExpiresIn') || '15m';
    const refreshExpiresIn =
      this.config.get<string>('jwt.refreshExpiresIn') || '7d';

    const { accessToken, refreshToken: newRefreshToken } =
      await JwtUtil.generateTokens(
        this.jwt,
        payload,
        accessExpiresIn,
        refreshExpiresIn,
      );

    await this.cacheService.set(
      `auth:access:${user.id}`,
      JwtUtil.encryptToken(accessToken),
      this.ms(accessExpiresIn),
    );

    await this.cacheService.set(
      `auth:refresh:${user.id}`,
      JwtUtil.encryptToken(newRefreshToken),
      this.ms(refreshExpiresIn),
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  private ms(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}
