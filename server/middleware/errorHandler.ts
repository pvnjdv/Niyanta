import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[NIYANTA ERROR]', err.stack);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong while processing the request',
    timestamp: new Date().toISOString(),
  });
}
