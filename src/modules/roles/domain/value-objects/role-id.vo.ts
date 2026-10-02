import { v7 as uuidv7, validate, version } from 'uuid';

import { InvalidRoleIdException } from '../exceptions/role.exceptions.js';

export class RoleId {
  private constructor(private readonly _value: string) {}

  static generate(): RoleId {
    return new RoleId(uuidv7());
  }

  static fromString(value: string): RoleId {
    if (!validate(value) || version(value) !== 7) {
      throw new InvalidRoleIdException(value);
    }
    return new RoleId(value.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: RoleId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
