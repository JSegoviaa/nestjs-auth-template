import { DomainException } from '../../../../shared/domain/domain.exception.js';
import { ErrorCode } from '../../../../shared/domain/error-code.enum.js';

export class InvalidPermissionIdException extends DomainException {
  constructor(value: string) {
    super(ErrorCode.INVALID_PERMISSION_ID, `"${value}" is not a valid UUID v7`);
  }
}

export class InvalidPermissionNameException extends DomainException {
  constructor(reason: string) {
    super(
      ErrorCode.INVALID_PERMISSION_NAME,
      `Invalid permission name: ${reason}`,
    );
  }
}

export class InvalidPermissionDescriptionException extends DomainException {
  constructor(reason: string) {
    super(
      ErrorCode.INVALID_PERMISSION_DESCRIPTION,
      `Invalid permission description: ${reason}`,
    );
  }
}

export class PermissionNotFoundException extends DomainException {
  constructor(id: string) {
    super(
      ErrorCode.PERMISSION_NOT_FOUND,
      `Permission with id "${id}" not found`,
    );
  }
}

export class PermissionAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(
      ErrorCode.PERMISSION_ALREADY_EXISTS,
      `Permission with name "${name}" already exists`,
    );
  }
}
