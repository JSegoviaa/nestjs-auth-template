import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';

import { AuthTokensResponse } from '../../application/dtos/auth-tokens.response.js';
import {
  AuthUserResponse,
  LoginResponse,
} from '../../application/dtos/auth-user.response.js';
import type { AuthenticatedUser } from '../../application/dtos/authenticated-user.js';
import {
  GetCurrentUserUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokensUseCase,
} from '../../application/use-cases/index.js';
import { AuthExceptionFilter } from './auth-exception.filter.js';
import { AuthPermission, CurrentUser } from './decorators/index.js';
import { LoginDto, RefreshTokenDto } from './dtos/index.js';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refreshTokens: RefreshTokensUseCase,
    private readonly logout: LogoutUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.login.execute({ email: dto.email, password: dto.password });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.refreshTokens.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signOut(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.logout.execute(dto.refreshToken);
  }

  @Get('me')
  @AuthPermission()
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserResponse> {
    return this.getCurrentUser.execute(user.id);
  }
}
