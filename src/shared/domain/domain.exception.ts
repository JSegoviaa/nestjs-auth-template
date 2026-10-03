import type { ErrorCode } from './error-code.enum.js';

export abstract class DomainException extends Error {
  protected constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
