import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import * as pageService from '../services/page.service.js';
import { AppError } from '../lib/AppError.js';

// ─── Zod Schemas ─────────────────────────────────────────────

const createPageSchema = z.object({
  parentId: z.string().cuid().optional(),
  title: z.string().max(255).optional(),
  icon: z.string().max(50).optional(),
});

const updatePageSchema = z.object({
  title: z.string().max(255).optional(),
  icon: z.string().max(50).optional(),
  content: z.any().optional(),
  parentId: z.string().cuid().nullable().optional(),
  sortOrder: z.string().max(50).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

// ─── Controllers ─────────────────────────────────────────────

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const workspaceId = req.params.workspaceId as string;
    const pages = await pageService.list(workspaceId, req.userId);

    res.status(200).json({ data: pages });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const pageId = req.params.id as string;
    const page = await pageService.getById(pageId, req.userId);

    res.status(200).json({ data: page });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const parsed = createPageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const workspaceId = req.params.workspaceId as string;
    const page = await pageService.create(
      workspaceId,
      req.userId,
      parsed.data
    );

    res.status(201).json({ data: page });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const parsed = updatePageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.issues);
    }

    const pageId = req.params.id as string;
    const page = await pageService.update(
      pageId,
      req.userId,
      parsed.data
    );

    res.status(200).json({ data: page });
  } catch (err) {
    next(err);
  }
}

export async function softDelete(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const pageId = req.params.id as string;
    await pageService.softDelete(pageId, req.userId);

    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}
