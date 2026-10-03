import { UserId } from '../../../users/domain/value-objects/index.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { TokenService } from '../../domain/services/token.service.js';
import { RefreshTokenId } from '../../domain/value-objects/index.js';
import { AuthTokensResponse } from '../dtos/auth-tokens.response.js';

export class AuthTokensService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async issue(userId: UserId): Promise<AuthTokensResponse> {
    const refreshTokenId = RefreshTokenId.generate();

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({ sub: userId.value }),
      this.tokenService.signRefreshToken({
        sub: userId.value,
        jti: refreshTokenId.value,
      }),
    ]);

    await this.refreshTokens.create(
      RefreshToken.issue({
        id: refreshTokenId,
        userId,
        tokenHash: this.tokenService.hashToken(refreshToken),
        expiresAt: new Date(
          Date.now() + this.tokenService.refreshTokenTtlSeconds * 1000,
        ),
      }),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenService.accessTokenTtlSeconds,
    };
  }
}
