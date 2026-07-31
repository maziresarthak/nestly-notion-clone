import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger.js';

declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Request logging middleware.
 * Logs: method, path, status, duration, userId (if auth'd), requestId.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID().slice(0, 8);
  req.requestId = requestId;

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || undefined,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
}
