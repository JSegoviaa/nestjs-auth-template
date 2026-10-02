import { InvalidPermissionNameException } from '../exceptions/permission.exceptions.js';

export class PermissionName {
  static readonly MIN_LENGTH = 3;
  static readonly MAX_LENGTH = 100;
  // e.g. "USERS_CREATE", "ROLES_READ", "CONTENT_PAGES_PUBLISH"
  static readonly PATTERN = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;
  static readonly FORMAT_MESSAGE =
    'must be uppercase words separated by underscores (e.g. "USERS_CREATE")';

  private constructor(private readonly _value: string) {}

  static create(raw: string): PermissionName {
    const value = raw?.trim().toUpperCase() ?? '';

    if (value.length < PermissionName.MIN_LENGTH) {
      throw new InvalidPermissionNameException(
        `must have at least ${PermissionName.MIN_LENGTH} characters`,
      );
    }
    if (value.length > PermissionName.MAX_LENGTH) {
      throw new InvalidPermissionNameException(
        `must have at most ${PermissionName.MAX_LENGTH} characters`,
      );
    }
    if (!PermissionName.PATTERN.test(value)) {
      throw new InvalidPermissionNameException(PermissionName.FORMAT_MESSAGE);
    }

    return new PermissionName(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PermissionName): boolean {
    return this._value === other._value;
  }
}
