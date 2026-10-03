import { Global, Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserRepository } from '../users/domain/repositories/index.js';
import { PasswordHasher } from '../users/domain/services/index.js';
import { UsersModule } from '../users/users.module.js';
import { AuthenticatedUserReader } from './application/ports/index.js';
import { AuthTokensService } from './application/services/auth-tokens.service.js';
import {
  GetAuthenticatedUserUseCase,
  GetCurrentUserUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokensUseCase,
} from './application/use-cases/index.js';
import { RefreshTokenRepository } from './domain/repositories/index.js';
import { TokenService } from './domain/services/index.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service.js';
import {
  JWT_STRATEGY,
  JwtStrategy,
} from './infrastructure/passport/jwt.strategy.js';
import { PrismaAuthenticatedUserReader } from './infrastructure/persistence/prisma-authenticated-user.reader.js';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository.js';

// Application classes are plain (no framework decorators), so they are
// wired here against their ports.
const applicationProviders: Provider[] = [
  {
    provide: AuthTokensService,
    useFactory: (tokens: TokenService, refreshTokens: RefreshTokenRepository) =>
      new AuthTokensService(tokens, refreshTokens),
    inject: [TokenService, RefreshTokenRepository],
  },
  {
    provide: GetCurrentUserUseCase,
    useFactory: (reader: AuthenticatedUserReader) =>
      new GetCurrentUserUseCase(reader),
    inject: [AuthenticatedUserReader],
  },
  {
    provide: LoginUseCase,
    useFactory: (
      users: UserRepository,
      passwordHasher: PasswordHasher,
      authTokens: AuthTokensService,
      getCurrentUser: GetCurrentUserUseCase,
    ) => new LoginUseCase(users, passwordHasher, authTokens, getCurrentUser),
    inject: [
      UserRepository,
      PasswordHasher,
      AuthTokensService,
      GetCurrentUserUseCase,
    ],
  },
  {
    provide: RefreshTokensUseCase,
    useFactory: (
      tokens: TokenService,
      refreshTokens: RefreshTokenRepository,
      users: UserRepository,
      authTokens: AuthTokensService,
    ) => new RefreshTokensUseCase(tokens, refreshTokens, users, authTokens),
    inject: [
      TokenService,
      RefreshTokenRepository,
      UserRepository,
      AuthTokensService,
    ],
  },
  {
    provide: LogoutUseCase,
    useFactory: (tokens: TokenService, refreshTokens: RefreshTokenRepository) =>
      new LogoutUseCase(tokens, refreshTokens),
    inject: [TokenService, RefreshTokenRepository],
  },
  {
    provide: GetAuthenticatedUserUseCase,
    useFactory: (reader: AuthenticatedUserReader) =>
      new GetAuthenticatedUserUseCase(reader),
    inject: [AuthenticatedUserReader],
  },
];

const passportModule = PassportModule.register({
  defaultStrategy: JWT_STRATEGY,
});

// Global: @AuthPermission() is used in every module's controllers, and its
// JwtAuthGuard needs PassportModule's options wherever it is instantiated.
@Global()
@Module({
  imports: [UsersModule, passportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    { provide: TokenService, useClass: JwtTokenService },
    { provide: RefreshTokenRepository, useClass: PrismaRefreshTokenRepository },
    {
      provide: AuthenticatedUserReader,
      useClass: PrismaAuthenticatedUserReader,
    },
    ...applicationProviders,
    JwtStrategy,
  ],
  exports: [passportModule],
})
export class AuthModule {}
