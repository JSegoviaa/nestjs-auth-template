import { UserRepository } from '../../../users/domain/repositories/index.js';
import { InvalidRefreshTokenException } from '../../domain/exceptions/auth.exceptions.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { TokenService } from '../../domain/services/token.service.js';
import { RefreshTokenId } from '../../domain/value-objects/index.js';
import { AuthTokensResponse } from '../dtos/auth-tokens.response.js';
import { AuthTokensService } from '../services/auth-tokens.service.js';

export class RefreshTokensUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly users: UserRepository,
    private readonly authTokens: AuthTokensService,
  ) {}

  async execute(rawRefreshToken: string): Promise<AuthTokensResponse> {
    const payload = await this.tokenService.verifyRefreshToken(rawRefreshToken);
    if (!payload) {
      throw new InvalidRefreshTokenException();
    }

    const stored = await this.refreshTokens.findById(
      RefreshTokenId.fromString(payload.jti),
    );
    if (
      !stored ||
      stored.userId.value !== payload.sub ||
      !stored.matches(this.tokenService.hashToken(rawRefreshToken)) ||
      stored.isExpired()
    ) {
      throw new InvalidRefreshTokenException();
    }

    // A revoked token being reused means it was probably stolen: revoke
    // every session of the user so the attacker's copy stops working too.
    if (stored.isRevoked || !(await this.refreshTokens.revoke(stored.id))) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw new InvalidRefreshTokenException();
    }

    const user = await this.users.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new InvalidRefreshTokenException();
    }

    return this.authTokens.issue(user.id);
  }
}
