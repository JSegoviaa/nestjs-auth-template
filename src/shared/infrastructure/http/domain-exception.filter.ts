import { ArgumentsHost, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { DomainException } from '../../domain/domain.exception.js';

export type ExceptionStatusMap = ReadonlyMap<Function, HttpStatus>;

/**
 * Translates domain exceptions into HTTP responses. Each module extends it,
 * decorates the subclass with `@Catch(DomainException)` and provides its map.
 */
export abstract class DomainExceptionFilter implements ExceptionFilter {
  protected abstract readonly statusByException: ExceptionStatusMap;

  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      this.statusByException.get(exception.constructor) ??
      HttpStatus.UNPROCESSABLE_ENTITY;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
