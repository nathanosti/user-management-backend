import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

export class JwtUtil {
  static encryptToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async generateTokens(
    jwtService: JwtService,
    payload: any,
    accessExpiresIn: string,
    refreshExpiresIn: string,
  ) {
    const accessToken = await jwtService.signAsync(payload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await jwtService.signAsync(payload, {
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }
}
