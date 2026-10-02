import { DomainException } from '../../../../shared/domain/domain.exception.js';

export class InvalidPermissionIdException extends DomainException {
  constructor(value: string) {
    super(`"${value}" is not a valid UUID v7`);
  }
}

export class InvalidPermissionNameException extends DomainException {
  constructor(reason: string) {
    super(`Invalid permission name: ${reason}`);
  }
}

export class InvalidPermissionDescriptionException extends DomainException {
  constructor(reason: string) {
    super(`Invalid permission description: ${reason}`);
  }
}

export class PermissionNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Permission with id "${id}" not found`);
  }
}

export class PermissionAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(`Permission with name "${name}" already exists`);
  }
}
