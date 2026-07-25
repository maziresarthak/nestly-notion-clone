import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import * as workspaceService from '../services/workspace.service.js';
import { AppError } from '../lib/AppError.js';

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const workspaces = await workspaceService.getByUserId(req.userId);

    res.status(200).json({ data: workspaces });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const workspace = await workspaceService.update(
      req.params.id as string,
      req.userId,
      parsed.data
    );

    res.status(200).json({ data: workspace });
  } catch (err) {
    next(err);
  }
}
