import { DomainException } from '../../../../shared/domain/domain.exception.js';
import { ErrorCode } from '../../../../shared/domain/error-code.enum.js';

/** Same message for unknown email and wrong password: never reveal which. */
export class InvalidCredentialsException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
  }
}

export class InactiveUserException extends DomainException {
  constructor() {
    super(ErrorCode.INACTIVE_USER, 'User is inactive');
  }
}

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_REFRESH_TOKEN, 'Invalid or expired refresh token');
  }
}

/** The token was valid but its user is gone or no longer active. */
export class SessionUserUnavailableException extends DomainException {
  constructor() {
    super(
      ErrorCode.SESSION_USER_UNAVAILABLE,
      'The authenticated user no longer exists or is inactive',
    );
  }
}
