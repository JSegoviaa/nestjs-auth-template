import { InvalidHashedPasswordException } from '../exceptions/user.exceptions.js';

export class HashedPassword {
  private constructor(private readonly _value: string) {}

  static fromHash(hash: string): HashedPassword {
    if (!hash) {
      throw new InvalidHashedPasswordException();
    }
    return new HashedPassword(hash);
  }

  get value(): string {
    return this._value;
  }
}
