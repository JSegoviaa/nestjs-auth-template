import type { NextFunction, Request, Response } from 'express';
import { v7 as uuidv7, validate } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Reuses the incoming `X-Request-Id` when it is a valid UUID (e.g. set by a
 * gateway); otherwise generates one. It is echoed back in the response header.
 */
export function assignRequestId(req: Request, res: Response): string {
  const incoming = req.header(REQUEST_ID_HEADER);
  req.requestId = incoming && validate(incoming) ? incoming : uuidv7();
  res.setHeader(REQUEST_ID_HEADER, req.requestId);
  return req.requestId;
}

/**
 * Tags every request with an id so it can be traced in logs and error
 * responses.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  assignRequestId(req, res);
  next();
}
