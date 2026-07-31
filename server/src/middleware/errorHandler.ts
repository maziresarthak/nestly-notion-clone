import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

/**
 * Centralized error handler middleware.
 * - AppError instances → structured JSON with correct status code.
 * - Unknown errors → 500 with generic message (no leak of internals).
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  // Payload too large (Express body-parser)
  if ('type' in err && (err as Record<string, unknown>).type === 'entity.too.large') {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the maximum allowed size (1MB)',
      },
    });
    return;
  }

  // Unknown / unexpected error — log full stack server-side only
  logger.error(
    { err, requestId: req.requestId, path: req.originalUrl },
    'Unhandled error'
  );
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

