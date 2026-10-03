import { v7 as uuidv7, validate, version } from 'uuid';

import { InvalidRefreshTokenException } from '../exceptions/auth.exceptions.js';

export class RefreshTokenId {
  private constructor(private readonly _value: string) {}

  static generate(): RefreshTokenId {
    return new RefreshTokenId(uuidv7());
  }

  static fromString(value: string): RefreshTokenId {
    if (!validate(value) || version(value) !== 7) {
      throw new InvalidRefreshTokenException();
    }
    return new RefreshTokenId(value.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: RefreshTokenId): boolean {
    return this._value === other._value;
  }
}
