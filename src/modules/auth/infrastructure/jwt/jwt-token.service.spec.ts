import { JwtService } from '@nestjs/jwt';

import { JwtTokenService } from './jwt-token.service.js';

describe('JwtTokenService', () => {
  const service = new JwtTokenService(new JwtService({}));
  const payload = {
    sub: '01920000-0000-7000-8000-000000000001',
    jti: '01920000-0000-7000-8000-000000000002',
  };

  it('signs and verifies refresh tokens', async () => {
    const token = await service.signRefreshToken(payload);

    await expect(service.verifyRefreshToken(token)).resolves.toEqual(payload);
  });

  it('never accepts an access token as a refresh token', async () => {
    const accessToken = await service.signAccessToken({ sub: payload.sub });

    await expect(service.verifyRefreshToken(accessToken)).resolves.toBeNull();
  });

  it('rejects tampered tokens', async () => {
    const token = await service.signRefreshToken(payload);

    await expect(
      service.verifyRefreshToken(`${token.slice(0, -2)}xx`),
    ).resolves.toBeNull();
  });

  it('hashes deterministically without exposing the token', () => {
    expect(service.hashToken('abc')).toBe(service.hashToken('abc'));
    expect(service.hashToken('abc')).toHaveLength(64);
    expect(service.hashToken('abc')).not.toContain('abc');
  });
});
