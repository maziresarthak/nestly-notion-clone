import type { Response } from 'express';
import { env } from './env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Set the refresh token as an HttpOnly, Secure, SameSite=Strict cookie.
 * Path restricted to /api/auth so it's only sent to auth endpoints.
 */
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/api/auth',
  });
}

export { REFRESH_COOKIE_NAME };
