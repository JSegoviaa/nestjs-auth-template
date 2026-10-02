import { InvalidRoleNameException } from '../exceptions/role.exceptions.js';

export class RoleName {
  static readonly MIN_LENGTH = 3;
  static readonly MAX_LENGTH = 50;
  // Letters (accents included), digits, spaces, "-" and "_"; must start with
  // a letter or digit. e.g. "Administrador", "Editor de contenido".
  static readonly PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u;
  static readonly FORMAT_MESSAGE =
    'must start with a letter or digit and contain only letters, digits, spaces, "-" or "_"';

  private constructor(private readonly _value: string) {}

  static create(raw: string): RoleName {
    // Trim and collapse repeated spaces: "  Editor   web " -> "Editor web".
    const value = raw?.trim().replace(/\s+/g, ' ') ?? '';

    if (value.length < RoleName.MIN_LENGTH) {
      throw new InvalidRoleNameException(
        `must have at least ${RoleName.MIN_LENGTH} characters`,
      );
    }
    if (value.length > RoleName.MAX_LENGTH) {
      throw new InvalidRoleNameException(
        `must have at most ${RoleName.MAX_LENGTH} characters`,
      );
    }
    if (!RoleName.PATTERN.test(value)) {
      throw new InvalidRoleNameException(RoleName.FORMAT_MESSAGE);
    }

    return new RoleName(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: RoleName): boolean {
    return this._value === other._value;
  }
}
