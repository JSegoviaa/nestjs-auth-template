import { v7 as uuidv7, validate, version } from 'uuid';

import { InvalidUserIdException } from '../exceptions/user.exceptions.js';

export class UserId {
  private constructor(private readonly _value: string) {}

  static generate(): UserId {
    return new UserId(uuidv7());
  }

  static fromString(value: string): UserId {
    if (!validate(value) || version(value) !== 7) {
      throw new InvalidUserIdException(value);
    }
    return new UserId(value.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
