import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtUtil } from '../utils/jwt.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const rawToken =
            req?.cookies?.accessToken ||
            ExtractJwt.fromAuthHeaderAsBearerToken()(req);

          if (!rawToken) return null;

          try {
            return JwtUtil.decryptToken(rawToken);
          } catch (e) {
            throw new UnauthorizedException('INVALID_TOKEN_FORMAT');
          }
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
