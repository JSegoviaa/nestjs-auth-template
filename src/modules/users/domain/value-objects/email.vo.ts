import { InvalidEmailException } from '../exceptions/user.exceptions.js';

// Basic shape check; the HTTP layer applies the stricter @IsEmail().
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  static readonly MAX_LENGTH = 255;

  private constructor(private readonly _value: string) {}

  /** Stored trimmed and lowercased so uniqueness is case-insensitive. */
  static create(raw: string): Email {
    const value = raw?.trim().toLowerCase() ?? '';

    if (value.length > Email.MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
      throw new InvalidEmailException(raw);
    }

    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
