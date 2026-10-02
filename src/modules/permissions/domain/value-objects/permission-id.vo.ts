import { v7 as uuidv7, validate, version } from 'uuid';

import { InvalidPermissionIdException } from '../exceptions/permission.exceptions.js';

export class PermissionId {
  private constructor(private readonly _value: string) {}

  static generate(): PermissionId {
    return new PermissionId(uuidv7());
  }

  static fromString(value: string): PermissionId {
    if (!validate(value) || version(value) !== 7) {
      throw new InvalidPermissionIdException(value);
    }
    return new PermissionId(value.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: PermissionId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
