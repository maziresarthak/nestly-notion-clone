import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Simple health check endpoint — returns status + timestamp.
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
