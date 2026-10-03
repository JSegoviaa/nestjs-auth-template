import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ENVS } from '../../../../config/envs.js';
import { AuthenticatedUser } from '../../application/dtos/authenticated-user.js';
import { GetAuthenticatedUserUseCase } from '../../application/use-cases/get-authenticated-user.use-case.js';
import type { AccessTokenPayload } from '../../domain/services/token.service.js';

export const JWT_STRATEGY = 'jwt';

/**
 * Validates the `Authorization: Bearer <access token>` header. Whatever
 * `validate` returns becomes `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(
    private readonly getAuthenticatedUser: GetAuthenticatedUserUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ENVS.JWT.ACCESS_SECRET,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    // Loaded on every request: deactivations and role/permission changes
    // take effect immediately, not when the token expires.
    const user = await this.getAuthenticatedUser.execute(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
