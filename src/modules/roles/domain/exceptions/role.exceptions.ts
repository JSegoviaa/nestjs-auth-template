import { DomainException } from '../../../../shared/domain/domain.exception.js';

export class InvalidRoleIdException extends DomainException {
  constructor(value: string) {
    super(`"${value}" is not a valid UUID v7`);
  }
}

export class InvalidRoleNameException extends DomainException {
  constructor(reason: string) {
    super(`Invalid role name: ${reason}`);
  }
}

export class InvalidRoleDescriptionException extends DomainException {
  constructor(reason: string) {
    super(`Invalid role description: ${reason}`);
  }
}

export class RoleNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Role with id "${id}" not found`);
  }
}

export class RoleAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(`Role with name "${name}" already exists`);
  }
}

export class RoleWithoutPermissionsException extends DomainException {
  constructor() {
    super('A role must have at least one permission');
  }
}

export class RolePermissionsNotFoundException extends DomainException {
  constructor(ids: string[]) {
    super(`Permissions not found: ${ids.join(', ')}`);
  }
}
