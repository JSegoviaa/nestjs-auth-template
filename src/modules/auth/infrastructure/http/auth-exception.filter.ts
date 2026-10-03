import { Catch, HttpStatus } from '@nestjs/common';

import { DomainException } from '../../../../shared/domain/domain.exception.js';
import {
  DomainExceptionFilter,
  type ExceptionStatusMap,
} from '../../../../shared/infrastructure/http/domain-exception.filter.js';
import {
  InactiveUserException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
  SessionUserUnavailableException,
} from '../../domain/exceptions/auth.exceptions.js';

const AUTH_EXCEPTION_STATUS: ExceptionStatusMap = new Map<Function, HttpStatus>(
  [
    [InvalidCredentialsException, HttpStatus.UNAUTHORIZED],
    [InvalidRefreshTokenException, HttpStatus.UNAUTHORIZED],
    [SessionUserUnavailableException, HttpStatus.UNAUTHORIZED],
    [InactiveUserException, HttpStatus.FORBIDDEN],
  ],
);

@Catch(DomainException)
export class AuthExceptionFilter extends DomainExceptionFilter {
  protected readonly statusByException = AUTH_EXCEPTION_STATUS;
}
