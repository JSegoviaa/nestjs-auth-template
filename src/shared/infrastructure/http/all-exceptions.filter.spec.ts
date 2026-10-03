import {
  ForbiddenException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client.js';
import { InvalidCredentialsException } from '../../../modules/auth/domain/exceptions/auth.exceptions.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { RequestValidationException } from './request-validation.exception.js';

const REQUEST_ID = '019a0000-0000-7000-8000-000000000000';

const hostFor = () => {
  const response = { status: vi.fn(), json: vi.fn(), locals: {} };
  response.status.mockReturnValue(response);
  const request = {
    requestId: REQUEST_ID,
    method: 'POST',
    originalUrl: '/api/v1/auth/login?foo=bar',
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
};

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  const respond = (exception: unknown) => {
    const { host, response } = hostFor();
    filter.catch(exception, host);
    return {
      status: response.status.mock.calls[0][0] as number,
      body: response.json.mock.calls[0][0],
    };
  };

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('includes the request trace data in every error', () => {
    const { body } = respond(new NotFoundException());

    expect(body).toEqual({
      errorCode: 'NOT_FOUND',
      errors: ['Not Found'],
      requestId: REQUEST_ID,
      method: 'POST',
      path: '/api/v1/auth/login',
      timestamp: expect.any(String),
    });
  });

  it('returns every class-validator message', () => {
    const { status, body } = respond(
      new RequestValidationException([
        'email must be an email',
        'password should not be empty',
      ]),
    );

    expect(status).toBe(HttpStatus.BAD_REQUEST);
    expect(body.errorCode).toBe('VALIDATION_ERROR');
    expect(body.errors).toEqual([
      'email must be an email',
      'password should not be empty',
    ]);
  });

  it('uses the HttpException status name as code', () => {
    const { status, body } = respond(
      new ForbiddenException('Missing permissions: ROLE_READ'),
    );

    expect(status).toBe(HttpStatus.FORBIDDEN);
    expect(body.errorCode).toBe('FORBIDDEN');
    expect(body.errors).toEqual(['Missing permissions: ROLE_READ']);
  });

  it('derives the code from the domain exception name', () => {
    const { body } = respond(new InvalidCredentialsException());

    expect(body.errorCode).toBe('INVALID_CREDENTIALS');
    expect(body.errors).toEqual(['Invalid email or password']);
  });

  it('maps untranslated unique constraint violations to 409', () => {
    const { status, body } = respond(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    expect(status).toBe(HttpStatus.CONFLICT);
    expect(body.errorCode).toBe('UNIQUE_CONSTRAINT_VIOLATION');
  });

  it('hides the details of unexpected errors', () => {
    const { status, body } = respond(
      new Error('connection refused at 10.0.0.1'),
    );

    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.errorCode).toBe('INTERNAL_SERVER_ERROR');
    expect(body.errors).toEqual(['Internal server error']);
  });
});
