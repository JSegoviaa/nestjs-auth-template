import { ArgumentsHost, ExceptionFilter, HttpStatus } from '@nestjs/common';

import { DomainException } from '../../domain/domain.exception.js';
import { sendErrorResponse } from './error-response.js';

export type ExceptionStatusMap = ReadonlyMap<Function, HttpStatus>;

/**
 * Translates domain exceptions into HTTP responses. Each module extends it,
 * decorates the subclass with `@Catch(DomainException)` and provides its map.
 */
export abstract class DomainExceptionFilter implements ExceptionFilter {
  protected abstract readonly statusByException: ExceptionStatusMap;

  catch(exception: DomainException, host: ArgumentsHost): void {
    sendErrorResponse(host, {
      status:
        this.statusByException.get(exception.constructor) ??
        HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: exception.code,
      errors: [exception.message],
    });
  }
}
