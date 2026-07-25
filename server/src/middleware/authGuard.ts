import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from '../lib/AppError.js';

/**
 * Auth guard middleware.
 * Reads Bearer token from Authorization header, verifies JWT,
 * attaches userId to req, or returns 401.
 */
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Access token required');
    }

    const token = authHeader.slice(7);
    const userId = verifyAccessToken(token);
    req.userId = userId;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token'));
    }
  }
}
