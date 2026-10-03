import { DomainException } from '../../../../shared/domain/domain.exception.js';

/** Same message for unknown email and wrong password: never reveal which. */
export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Invalid email or password');
  }
}

export class InactiveUserException extends DomainException {
  constructor() {
    super('User is inactive');
  }
}

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super('Invalid or expired refresh token');
  }
}

/** The token was valid but its user is gone or no longer active. */
export class SessionUserUnavailableException extends DomainException {
  constructor() {
    super('The authenticated user no longer exists or is inactive');
  }
}
