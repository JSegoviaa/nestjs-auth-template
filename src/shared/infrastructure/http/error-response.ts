import type { ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';

import type { ErrorCode } from '../../domain/error-code.enum.js';

/** Body returned by the API for every failed request. */
export interface ErrorResponse {
  errorCode: ErrorCode;
  errors: string[];
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
}

export interface ErrorDetails {
  status: HttpStatus;
  errorCode: ErrorCode;
  errors: string[];
}

export function sendErrorResponse(
  host: ArgumentsHost,
  { status, errorCode, errors }: ErrorDetails,
): ErrorResponse {
  const http = host.switchToHttp();
  const request = http.getRequest<Request>();
  const response = http.getResponse<Response>();

  const body: ErrorResponse = {
    errorCode,
    errors,
    // Fallback for requests that skipped the middleware (e.g. tests).
    requestId: request.requestId ?? uuidv7(),
    method: request.method,
    path: request.originalUrl.split('?')[0],
    timestamp: new Date().toISOString(),
  };

  // Picked up by the request logger (see logging/pino-http.options.ts).
  response.locals.error = { errorCode, errors };
  response.status(status).json(body);
  return body;
}
