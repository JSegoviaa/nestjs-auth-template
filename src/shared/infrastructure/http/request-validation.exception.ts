import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** Thrown by the global ValidationPipe when a DTO fails class-validator. */
export class RequestValidationException extends BadRequestException {
  constructor(readonly errors: string[]) {
    super(errors);
  }

  /** Use as `ValidationPipe({ exceptionFactory })`. */
  static fromValidationErrors(
    this: void,
    errors: ValidationError[],
  ): RequestValidationException {
    return new RequestValidationException(flatten(errors));
  }
}

/** Nested DTO errors are prefixed with their path, e.g. "address.city must be a string". */
function flatten(errors: ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const prefix = parentPath ? `${parentPath}.` : '';
    const messages = Object.values(error.constraints ?? {}).map(
      (message) => `${prefix}${message}`,
    );
    const children = flatten(
      error.children ?? [],
      `${prefix}${error.property}`,
    );
    return [...messages, ...children];
  });
}
