import { DomainException } from '../../../../shared/domain/domain.exception.js';
import { ErrorCode } from '../../../../shared/domain/error-code.enum.js';

export class InvalidRoleIdException extends DomainException {
  constructor(value: string) {
    super(ErrorCode.INVALID_ROLE_ID, `"${value}" is not a valid UUID v7`);
  }
}

export class InvalidRoleNameException extends DomainException {
  constructor(reason: string) {
    super(ErrorCode.INVALID_ROLE_NAME, `Invalid role name: ${reason}`);
  }
}

export class InvalidRoleDescriptionException extends DomainException {
  constructor(reason: string) {
    super(
      ErrorCode.INVALID_ROLE_DESCRIPTION,
      `Invalid role description: ${reason}`,
    );
  }
}

export class RoleNotFoundException extends DomainException {
  constructor(id: string) {
    super(ErrorCode.ROLE_NOT_FOUND, `Role with id "${id}" not found`);
  }
}

export class RoleAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(
      ErrorCode.ROLE_ALREADY_EXISTS,
      `Role with name "${name}" already exists`,
    );
  }
}

export class RoleAssignedToUsersException extends DomainException {
  constructor(id: string) {
    super(
      ErrorCode.ROLE_ASSIGNED_TO_USERS,
      `Role with id "${id}" is assigned to users and cannot be deleted`,
    );
  }
}

export class RoleWithoutPermissionsException extends DomainException {
  constructor() {
    super(
      ErrorCode.ROLE_WITHOUT_PERMISSIONS,
      'A role must have at least one permission',
    );
  }
}

export class RolePermissionsNotFoundException extends DomainException {
  constructor(ids: string[]) {
    super(
      ErrorCode.ROLE_PERMISSIONS_NOT_FOUND,
      `Permissions not found: ${ids.join(', ')}`,
    );
  }
}
