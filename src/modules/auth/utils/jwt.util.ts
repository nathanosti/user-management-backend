import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

const ENCRYPTION_SECRET_RAW =
  process.env.JWT_ENCRYPTION_SECRET || 'default_32_byte_secret_str!32125';

if (ENCRYPTION_SECRET_RAW.length !== 32) {
  throw new Error('JWT_ENCRYPTION_SECRET must be exactly 32 characters long');
}

const ENCRYPTION_SECRET = Buffer.from(ENCRYPTION_SECRET_RAW, 'utf-8');

export class JwtUtil {
  static encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_SECRET, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decryptToken(encrypted: string): string {
    try {
      const [ivHex, encryptedData] = encrypted.split(':');
      if (!ivHex || !encryptedData) {
        throw new Error('Invalid token format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_SECRET, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      throw new Error('Failed to decrypt token');
    }
  }

  static hashToken(token: string): string {
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

