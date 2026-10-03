export interface AccessTokenPayload {
  sub: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export abstract class TokenService {
  abstract readonly accessTokenTtlSeconds: number;
  abstract readonly refreshTokenTtlSeconds: number;

  abstract signAccessToken(payload: AccessTokenPayload): Promise<string>;
  abstract signRefreshToken(payload: RefreshTokenPayload): Promise<string>;
  abstract verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload | null>;
  abstract hashToken(token: string): string;
}
