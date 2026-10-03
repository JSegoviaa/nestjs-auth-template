import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';
import { DomainException } from '../../domain/domain.exception.js';
import { ErrorCode } from '../../domain/error-code.enum.js';
import { type ErrorDetails, sendErrorResponse } from './error-response.js';
import { RequestValidationException } from './request-validation.exception.js';

const INTERNAL_ERROR: ErrorDetails = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
  errors: ['Internal server error'],
};

/** Prisma errors that reach this point were not translated by a repository. */
const PRISMA_ERRORS: Record<string, ErrorDetails> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    errorCode: ErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
    errors: ['A record with the same unique value already exists'],
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    errorCode: ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION,
    errors: ['The record references or is referenced by another record'],
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    errorCode: ErrorCode.RECORD_NOT_FOUND,
    errors: ['The requested record does not exist'],
  },
};

const HTTP_ERROR_CODES: ReadonlyMap<HttpStatus, ErrorCode> = new Map([
  [HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST],
  [HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED],
  [HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN],
  [HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND],
  [HttpStatus.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED],
  [HttpStatus.CONFLICT, ErrorCode.CONFLICT],
  [HttpStatus.PAYLOAD_TOO_LARGE, ErrorCode.PAYLOAD_TOO_LARGE],
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE, ErrorCode.UNSUPPORTED_MEDIA_TYPE],
  [HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS],
]);

/**
 * Last line of defense: every exception not handled by a module filter ends
 * here, so all error responses share the same shape (see ErrorResponse).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const details = this.toErrorDetails(exception);
    const body = sendErrorResponse(host, details);

    if (details.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${body.requestId}] ${body.method} ${body.path}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
  }

  private toErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof RequestValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
        errors: exception.errors,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        errorCode: HTTP_ERROR_CODES.get(status) ?? ErrorCode.HTTP_ERROR,
        errors: this.httpExceptionMessages(exception),
      };
    }

    if (exception instanceof DomainException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCode: exception.code,
        errors: [exception.message],
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return PRISMA_ERRORS[exception.code] ?? INTERNAL_ERROR;
    }

    return INTERNAL_ERROR;
  }

  private httpExceptionMessages(exception: HttpException): string[] {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return [response];
    }

    const { message } = response as { message?: string | string[] };
    if (Array.isArray(message)) {
      return message;
    }
    return [message ?? exception.message];
  }
}
