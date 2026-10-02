import { InvalidRoleDescriptionException } from '../exceptions/role.exceptions.js';

export class RoleDescription {
  static readonly MAX_LENGTH = 255;

  private constructor(private readonly _value: string | null) {}

  static create(raw?: string | null): RoleDescription {
    const value = raw?.trim() || null;

    if (value && value.length > RoleDescription.MAX_LENGTH) {
      throw new InvalidRoleDescriptionException(
        `must have at most ${RoleDescription.MAX_LENGTH} characters`,
      );
    }

    return new RoleDescription(value);
  }

  static empty(): RoleDescription {
    return new RoleDescription(null);
  }

  get value(): string | null {
    return this._value;
  }

  equals(other: RoleDescription): boolean {
    return this._value === other._value;
  }
}
