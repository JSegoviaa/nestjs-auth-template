import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import { RoleId } from '../../../roles/domain/value-objects/index.js';
import { User } from '../../../users/domain/entities/index.js';
import { UserRepository } from '../../../users/domain/repositories/index.js';
import { PasswordHasher } from '../../../users/domain/services/index.js';
import {
  Email,
  HashedPassword,
  PersonName,
  UserId,
  UserStatus,
} from '../../../users/domain/value-objects/index.js';
import { RefreshToken } from '../../domain/entities/refresh-token.entity.js';
import {
  InactiveUserException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
  SessionUserUnavailableException,
} from '../../domain/exceptions/auth.exceptions.js';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from '../../domain/services/token.service.js';
import { RefreshTokenId } from '../../domain/value-objects/index.js';
import {
  AuthenticatedUserReader,
  AuthenticatedUserView,
} from '../ports/authenticated-user.reader.js';
import { AuthTokensService } from '../services/auth-tokens.service.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { LoginUseCase } from './login.use-case.js';
import { LogoutUseCase } from './logout.use-case.js';
import { RefreshTokensUseCase } from './refresh-tokens.use-case.js';

/** Tokens are readable strings: "access:<sub>" / "refresh:<sub>:<jti>". */
class FakeTokenService implements TokenService {
  readonly accessTokenTtlSeconds = 900;
  readonly refreshTokenTtlSeconds = 3600;

  signAccessToken({ sub }: AccessTokenPayload): Promise<string> {
    return Promise.resolve(`access:${sub}`);
  }

  signRefreshToken({ sub, jti }: RefreshTokenPayload): Promise<string> {
    return Promise.resolve(`refresh:${sub}:${jti}`);
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    const [type, sub, jti] = token.split(':');
    return Promise.resolve(type === 'refresh' ? { sub, jti } : null);
  }

  hashToken(token: string): string {
    return `hash(${token})`;
  }
}

class FakePasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<HashedPassword> {
    return Promise.resolve(HashedPassword.fromHash(`hashed:${plain}`));
  }

  verify(hashed: HashedPassword, plain: string): Promise<boolean> {
    return Promise.resolve(hashed.value === `hashed:${plain}`);
  }
}

class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  readonly store = new Map<string, RefreshToken>();

  create(token: RefreshToken): Promise<void> {
    this.store.set(token.id.value, token);
    return Promise.resolve();
  }

  findById(id: RefreshTokenId): Promise<RefreshToken | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  revoke(id: RefreshTokenId): Promise<boolean> {
    const token = this.store.get(id.value);
    if (!token || token.isRevoked) return Promise.resolve(false);
    this.store.set(
      id.value,
      RefreshToken.fromPrimitives({
        ...token.toPrimitives(),
        revokedAt: new Date(),
      }),
    );
    return Promise.resolve(true);
  }

  revokeAllForUser(userId: UserId): Promise<void> {
    for (const token of this.store.values()) {
      if (token.userId.equals(userId) && !token.isRevoked) {
        void this.revoke(token.id);
      }
    }
    return Promise.resolve();
  }

  activeCount(): number {
    return [...this.store.values()].filter((t) => !t.isRevoked).length;
  }
}

class InMemoryUserRepository implements UserRepository {
  readonly store = new Map<string, User>();

  save(user: User): Promise<void> {
    this.store.set(user.id.value, user);
    return Promise.resolve();
  }

  findById(id: UserId): Promise<User | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByEmail(email: Email): Promise<User | null> {
    const found = [...this.store.values()].find((u) => u.email.equals(email));
    return Promise.resolve(found ?? null);
  }

  findAll(): Promise<PaginatedResult<User>> {
    throw new Error('Not used');
  }
}

/** Builds the read view from the in-memory users, with fixed permissions. */
class FakeAuthenticatedUserReader implements AuthenticatedUserReader {
  constructor(private readonly users: InMemoryUserRepository) {}

  findById(userId: string): Promise<AuthenticatedUserView | null> {
    const user = this.users.store.get(userId);
    if (!user) return Promise.resolve(null);
    const { id, firstName, lastName, email, phoneNumber } = user.toPrimitives();
    return Promise.resolve({
      id,
      firstName,
      lastName,
      email,
      phoneNumber,
      isActive: user.isActive,
      roles: [{ id: user.roleIds[0].value, name: 'ROOT' }],
      permissions: ['USER_READ'],
    });
  }
}

describe('Auth use cases', () => {
  let users: InMemoryUserRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let login: LoginUseCase;
  let refresh: RefreshTokensUseCase;
  let logout: LogoutUseCase;
  let getCurrentUser: GetCurrentUserUseCase;
  let user: User;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    const tokens = new FakeTokenService();
    const authTokens = new AuthTokensService(tokens, refreshTokens);
    getCurrentUser = new GetCurrentUserUseCase(
      new FakeAuthenticatedUserReader(users),
    );
    login = new LoginUseCase(
      users,
      new FakePasswordHasher(),
      authTokens,
      getCurrentUser,
    );
    refresh = new RefreshTokensUseCase(
      tokens,
      refreshTokens,
      users,
      authTokens,
    );
    logout = new LogoutUseCase(tokens, refreshTokens);

    user = User.create({
      firstName: PersonName.create('María'),
      lastName: PersonName.create('Pérez'),
      email: Email.create('maria@example.com'),
      password: HashedPassword.fromHash('hashed:Password1!'),
      roleIds: [RoleId.generate()],
    });
    void users.save(user);
  });

  const credentials = { email: 'MARIA@example.com', password: 'Password1!' };

  describe('LoginUseCase', () => {
    it('returns an access and a refresh token and stores only its hash', async () => {
      const result = await login.execute(credentials);

      expect(result).toMatchObject({
        accessToken: `access:${user.id.value}`,
        tokenType: 'Bearer',
        expiresIn: 900,
      });
      const [stored] = refreshTokens.store.values();
      expect(stored.matches(`hash(${result.refreshToken})`)).toBe(true);
      expect(stored.toPrimitives()).not.toHaveProperty('token');
    });

    it('returns the same user as GET /auth/me, without the password', async () => {
      const result = await login.execute(credentials);

      expect(result.user).toEqual(await getCurrentUser.execute(user.id.value));
      expect(result.user).toMatchObject({
        id: user.id.value,
        email: 'maria@example.com',
        permissions: ['USER_READ'],
      });
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('isActive');
    });

    it('gives the same error for unknown email, wrong password or bad email', async () => {
      for (const attempt of [
        { ...credentials, email: 'nadie@example.com' },
        { ...credentials, password: 'Wrong1!' },
        { ...credentials, email: 'not-an-email' },
      ]) {
        await expect(login.execute(attempt)).rejects.toThrow(
          InvalidCredentialsException,
        );
      }
    });

    it('rejects inactive users only after checking the password', async () => {
      user.changeStatus(UserStatus.INACTIVE);

      await expect(login.execute(credentials)).rejects.toThrow(
        InactiveUserException,
      );
      await expect(
        login.execute({ ...credentials, password: 'Wrong1!' }),
      ).rejects.toThrow(InvalidCredentialsException);
    });
  });

  describe('RefreshTokensUseCase', () => {
    it('rotates: returns a new pair and revokes the used refresh token', async () => {
      const first = await login.execute(credentials);

      const second = await refresh.execute(first.refreshToken);

      expect(second.refreshToken).not.toBe(first.refreshToken);
      expect(refreshTokens.activeCount()).toBe(1);
    });

    it('detects reuse of a rotated token and revokes every session', async () => {
      const first = await login.execute(credentials);
      const second = await refresh.execute(first.refreshToken);

      // Someone replays the old token...
      await expect(refresh.execute(first.refreshToken)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
      // ...so the legitimate new one is revoked too.
      expect(refreshTokens.activeCount()).toBe(0);
      await expect(refresh.execute(second.refreshToken)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('rejects invalid, unknown or tampered tokens', async () => {
      const { refreshToken } = await login.execute(credentials);
      const [, , jti] = refreshToken.split(':');

      for (const token of [
        'garbage',
        `refresh:${user.id.value}:01920000-0000-7000-8000-000000000001`,
        `refresh:01920000-0000-7000-8000-000000000002:${jti}`,
      ]) {
        await expect(refresh.execute(token)).rejects.toThrow(
          InvalidRefreshTokenException,
        );
      }
    });

    it('rejects refreshing once the user is deactivated', async () => {
      const { refreshToken } = await login.execute(credentials);
      user.changeStatus(UserStatus.INACTIVE);

      await expect(refresh.execute(refreshToken)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });
  });

  describe('GetCurrentUserUseCase', () => {
    it('rejects users that no longer exist or were deactivated', async () => {
      await expect(
        getCurrentUser.execute('01920000-0000-7000-8000-000000000001'),
      ).rejects.toThrow(SessionUserUnavailableException);

      user.changeStatus(UserStatus.INACTIVE);
      await expect(getCurrentUser.execute(user.id.value)).rejects.toThrow(
        SessionUserUnavailableException,
      );
    });
  });

  describe('LogoutUseCase', () => {
    it('revokes the session so its refresh token stops working', async () => {
      const { refreshToken } = await login.execute(credentials);

      await logout.execute(refreshToken);

      expect(refreshTokens.activeCount()).toBe(0);
      await expect(refresh.execute(refreshToken)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('is idempotent and only closes the given session', async () => {
      const first = await login.execute(credentials);
      await login.execute(credentials); // another device

      await logout.execute(first.refreshToken);
      await expect(logout.execute(first.refreshToken)).resolves.toBeUndefined();

      expect(refreshTokens.activeCount()).toBe(1);
    });

    it('rejects invalid tokens', async () => {
      await expect(logout.execute('garbage')).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });
  });
});
