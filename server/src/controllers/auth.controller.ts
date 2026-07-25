import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import * as authService from '../services/auth.service.js';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from '../lib/cookies.js';
import { AppError } from '../lib/AppError.js';

// ─── Zod Schemas ─────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

// ─── Controllers ─────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const { email, password, name } = parsed.data;
    const result = await authService.register(email, password, name);

    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const { idToken } = parsed.data;
    const result = await authService.googleAuth(idToken);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new AppError(401, 'NO_REFRESH_TOKEN', 'Refresh token not provided');
    }

    const result = await authService.refreshTokens(token);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await authService.logout(token);
    }

    clearRefreshCookie(res);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
