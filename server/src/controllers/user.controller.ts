import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import * as userService from '../services/user.service.js';
import { AppError } from '../lib/AppError.js';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const user = await userService.getById(req.userId);

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const user = await userService.update(req.userId, parsed.data);

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}
