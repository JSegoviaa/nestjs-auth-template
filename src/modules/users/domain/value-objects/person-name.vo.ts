import { InvalidPersonNameException } from '../exceptions/user.exceptions.js';

/** A first or last name, e.g. "María José", "O'Connor", "Pérez-Ruiz". */
export class PersonName {
  static readonly MIN_LENGTH = 2;
  static readonly MAX_LENGTH = 100;
  // Letters (accents included), spaces, apostrophes, dots and hyphens;
  // must start with a letter.
  static readonly PATTERN = /^\p{L}[\p{L} '.-]*$/u;
  static readonly FORMAT_MESSAGE =
    'must start with a letter and contain only letters, spaces, apostrophes, dots or hyphens';

  private constructor(private readonly _value: string) {}

  static create(raw: string): PersonName {
    // Trim and collapse repeated spaces: "  María   José " -> "María José".
    const value = raw?.trim().replace(/\s+/g, ' ') ?? '';

    if (value.length < PersonName.MIN_LENGTH) {
      throw new InvalidPersonNameException(
        `must have at least ${PersonName.MIN_LENGTH} characters`,
      );
    }
    if (value.length > PersonName.MAX_LENGTH) {
      throw new InvalidPersonNameException(
        `must have at most ${PersonName.MAX_LENGTH} characters`,
      );
    }
    if (!PersonName.PATTERN.test(value)) {
      throw new InvalidPersonNameException(PersonName.FORMAT_MESSAGE);
    }

    return new PersonName(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PersonName): boolean {
    return this._value === other._value;
  }
}
