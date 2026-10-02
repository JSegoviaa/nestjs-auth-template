import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

import { DomainException } from '../../../../shared/domain/domain.exception.js';
import {
  InvalidPermissionDescriptionException,
  InvalidPermissionIdException,
  InvalidPermissionNameException,
  PermissionAlreadyExistsException,
  PermissionNotFoundException,
} from '../../domain/exceptions/permission.exceptions.js';

const STATUS_BY_EXCEPTION = new Map<Function, HttpStatus>([
  [InvalidPermissionIdException, HttpStatus.BAD_REQUEST],
  [InvalidPermissionNameException, HttpStatus.BAD_REQUEST],
  [InvalidPermissionDescriptionException, HttpStatus.BAD_REQUEST],
  [PermissionNotFoundException, HttpStatus.NOT_FOUND],
  [PermissionAlreadyExistsException, HttpStatus.CONFLICT],
]);

/** Translates domain exceptions into HTTP responses. */
@Catch(DomainException)
export class PermissionExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      STATUS_BY_EXCEPTION.get(exception.constructor) ??
      HttpStatus.UNPROCESSABLE_ENTITY;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
