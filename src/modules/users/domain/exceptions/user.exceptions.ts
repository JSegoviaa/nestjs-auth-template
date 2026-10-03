import { DomainException } from '../../../../shared/domain/domain.exception.js';
import { ErrorCode } from '../../../../shared/domain/error-code.enum.js';

export class InvalidUserIdException extends DomainException {
  constructor(value: string) {
    super(ErrorCode.INVALID_USER_ID, `"${value}" is not a valid UUID v7`);
  }
}

export class InvalidPersonNameException extends DomainException {
  constructor(reason: string) {
    super(ErrorCode.INVALID_PERSON_NAME, `Invalid name: ${reason}`);
  }
}

export class InvalidEmailException extends DomainException {
  constructor(value: string) {
    super(ErrorCode.INVALID_EMAIL, `"${value}" is not a valid email`);
  }
}

export class InvalidPhoneNumberException extends DomainException {
  constructor(value: string) {
    super(
      ErrorCode.INVALID_PHONE_NUMBER,
      `"${value}" is not a valid phone number: must have exactly 10 digits`,
    );
  }
}

export class InvalidHashedPasswordException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_HASHED_PASSWORD, 'Password hash cannot be empty');
  }
}

export class UserNotFoundException extends DomainException {
  constructor(id: string) {
    super(ErrorCode.USER_NOT_FOUND, `User with id "${id}" not found`);
  }
}

export class UserEmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(
      ErrorCode.USER_EMAIL_ALREADY_EXISTS,
      `User with email "${email}" already exists`,
    );
  }
}

export class UserAlreadyActiveException extends DomainException {
  constructor(id: string) {
    super(
      ErrorCode.USER_ALREADY_ACTIVE,
      `User with id "${id}" is already active`,
    );
  }
}

export class UserAlreadyInactiveException extends DomainException {
  constructor(id: string) {
    super(
      ErrorCode.USER_ALREADY_INACTIVE,
      `User with id "${id}" is already inactive`,
    );
  }
}

export class UserWithoutRolesException extends DomainException {
  constructor() {
    super(ErrorCode.USER_WITHOUT_ROLES, 'A user must have at least one role');
  }
}

export class UserRolesNotFoundException extends DomainException {
  constructor(ids: string[]) {
    super(ErrorCode.USER_ROLES_NOT_FOUND, `Roles not found: ${ids.join(', ')}`);
  }
}
