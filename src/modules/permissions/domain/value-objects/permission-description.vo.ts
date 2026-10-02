import { InvalidPermissionDescriptionException } from '../exceptions/permission.exceptions.js';

export class PermissionDescription {
  static readonly MAX_LENGTH = 255;

  private constructor(private readonly _value: string | null) {}

  static create(raw?: string | null): PermissionDescription {
    const value = raw?.trim() || null;

    if (value && value.length > PermissionDescription.MAX_LENGTH) {
      throw new InvalidPermissionDescriptionException(
        `must have at most ${PermissionDescription.MAX_LENGTH} characters`,
      );
    }

    return new PermissionDescription(value);
  }

  static empty(): PermissionDescription {
    return new PermissionDescription(null);
  }

  get value(): string | null {
    return this._value;
  }

  equals(other: PermissionDescription): boolean {
    return this._value === other._value;
  }
}
