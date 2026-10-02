import { InvalidPhoneNumberException } from '../exceptions/user.exceptions.js';

/** Mexican phone number: exactly 10 digits, no country code. */
export class PhoneNumber {
  static readonly PATTERN = /^\d{10}$/;
  static readonly FORMAT_MESSAGE = 'must have exactly 10 digits';

  private constructor(private readonly _value: string) {}

  static create(raw: string): PhoneNumber {
    const value = raw?.trim() ?? '';

    if (!PhoneNumber.PATTERN.test(value)) {
      throw new InvalidPhoneNumberException(raw);
    }

    return new PhoneNumber(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }
}
