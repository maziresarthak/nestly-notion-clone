import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from './env.js';

/**
 * Sign a short-lived access token (15 minutes).
 */
export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

/**
 * Verify and decode an access token. Returns the userId or throws.
 */
export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  return payload.sub as string;
}

/**
 * Generate a random refresh token (32 bytes hex = 64 chars).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash a token for storage in the database.
 * We never store plaintext refresh tokens.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
