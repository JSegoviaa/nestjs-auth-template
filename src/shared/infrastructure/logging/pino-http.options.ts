import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Request, Response } from 'express';
import type { Options } from 'pino-http';
import type { TransportTargetOptions } from 'pino';

import { ENVS } from '../../../config/envs.js';
import { assignRequestId } from '../http/request-id.middleware.js';

export const LOG_FILE_BASENAME = 'app';

// Transports run in a worker thread, so they are referenced by file path.
const NEST_CONSOLE_TRANSPORT = fileURLToPath(
  new URL('./nest-console.transport.js', import.meta.url),
);

/** Never written to the logs, wherever they appear. */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'body.password',
  'body.currentPassword',
  'body.newPassword',
  'body.refreshToken',
];

function transportTargets(): TransportTargetOptions[] {
  const { LEVEL, DIR, RETENTION_FILES, MAX_FILE_SIZE } = ENVS.LOGS;

  // Nest's usual console format in development; raw JSON elsewhere.
  const console: TransportTargetOptions =
    ENVS.CONFIG.NODE_ENV === 'development'
      ? { target: NEST_CONSOLE_TRANSPORT, level: LEVEL }
      : { target: 'pino/file', level: LEVEL, options: { destination: 1 } };

  // Hourly files (e.g. logs/app.2026-10-02-14.1.log), so each one reaches the
  // bucket shortly after its hour ends.
  const file: TransportTargetOptions = {
    target: 'pino-roll',
    level: LEVEL,
    options: {
      file: resolve(DIR, LOG_FILE_BASENAME),
      frequency: 'hourly',
      dateFormat: 'yyyy-MM-dd-HH',
      size: MAX_FILE_SIZE,
      mkdir: true,
      limit: { count: RETENTION_FILES, removeOtherLogFiles: true },
    },
  };

  return [console, file];
}

export function pinoHttpOptions(): Options<Request, Response> {
  return {
    level: ENVS.LOGS.LEVEL,
    transport: { targets: transportTargets() },
    redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
    // Same id returned in the X-Request-Id header and in error responses.
    genReqId: (req, res) => req.requestId ?? assignRequestId(req, res),
    // Logs written while handling a request carry only its id
    // ({"requestId": ...}); the full request goes in the "request completed" log.
    quietReqLogger: true,
    customAttributeKeys: { reqId: 'requestId' },
    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    // The body is only logged for failed requests, to debug them without
    // storing every payload.
    customProps: (req, res) =>
      res.statusCode >= 400
        ? { body: req.body as unknown, ...res.locals.error }
        : {},
  };
}
