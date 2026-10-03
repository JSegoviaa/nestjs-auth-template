import { InvalidRefreshTokenException } from '../../domain/exceptions/auth.exceptions.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { TokenService } from '../../domain/services/token.service.js';
import { RefreshTokenId } from '../../domain/value-objects/index.js';

/**
 * Ends a session by revoking its refresh token. Idempotent: logging out
 * twice with the same token succeeds. The access token stays valid until
 * it expires (short-lived), so clients must discard it too.
 */
export class LogoutUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<void> {
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
      !stored.matches(this.tokenService.hashToken(rawRefreshToken))
    ) {
      throw new InvalidRefreshTokenException();
    }

    // Already revoked is fine: the session is closed either way.
    await this.refreshTokens.revoke(stored.id);
  }
}
