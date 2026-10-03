import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ENVS } from '../../../../config/envs.js';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from '../../domain/services/token.service.js';

const ALGORITHM = 'HS256';

@Injectable()
export class JwtTokenService implements TokenService {
  readonly accessTokenTtlSeconds = ENVS.JWT.ACCESS_EXPIRES_IN_SECONDS;
  readonly refreshTokenTtlSeconds = ENVS.JWT.REFRESH_EXPIRES_IN_SECONDS;

  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(
      { sub: payload.sub },
      {
        secret: ENVS.JWT.ACCESS_SECRET,
        expiresIn: this.accessTokenTtlSeconds,
        algorithm: ALGORITHM,
      },
    );
  }

  signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwt.signAsync(
      { sub: payload.sub, jti: payload.jti },
      {
        secret: ENVS.JWT.REFRESH_SECRET,
        expiresIn: this.refreshTokenTtlSeconds,
        algorithm: ALGORITHM,
      },
    );
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const payload = await this.jwt.verifyAsync<Partial<RefreshTokenPayload>>(
        token,
        { secret: ENVS.JWT.REFRESH_SECRET, algorithms: [ALGORITHM] },
      );
      if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
        return null;
      }
      return { sub: payload.sub, jti: payload.jti };
    } catch {
      // Bad signature, malformed or expired.
      return null;
    }
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
