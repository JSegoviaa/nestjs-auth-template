import { DomainException } from '../../../../shared/domain/domain.exception.js';

export class InvalidUserIdException extends DomainException {
  constructor(value: string) {
    super(`"${value}" is not a valid UUID v7`);
  }
}

export class InvalidPersonNameException extends DomainException {
  constructor(reason: string) {
    super(`Invalid name: ${reason}`);
  }
}

export class InvalidEmailException extends DomainException {
  constructor(value: string) {
    super(`"${value}" is not a valid email`);
  }
}

export class InvalidPhoneNumberException extends DomainException {
  constructor(value: string) {
    super(
      `"${value}" is not a valid phone number: must have exactly 10 digits`,
    );
  }
}

export class InvalidHashedPasswordException extends DomainException {
  constructor() {
    super('Password hash cannot be empty');
  }
}

export class UserNotFoundException extends DomainException {
  constructor(id: string) {
    super(`User with id "${id}" not found`);
  }
}

export class UserEmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}

export class UserAlreadyActiveException extends DomainException {
  constructor(id: string) {
    super(`User with id "${id}" is already active`);
  }
}

export class UserAlreadyInactiveException extends DomainException {
  constructor(id: string) {
    super(`User with id "${id}" is already inactive`);
  }
}

export class UserWithoutRolesException extends DomainException {
  constructor() {
    super('A user must have at least one role');
  }
}

export class UserRolesNotFoundException extends DomainException {
  constructor(ids: string[]) {
    super(`Roles not found: ${ids.join(', ')}`);
  }
}
