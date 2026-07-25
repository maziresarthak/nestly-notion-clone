import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import workspaceRoutes from './routes/workspace.js';
import pageRoutes from './routes/page.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';
import { authGuard } from './middleware/authGuard.js';
import { AppError } from './lib/AppError.js';

const app = express();

// ─── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, authGuard, userRoutes);
app.use('/api/workspaces', apiLimiter, authGuard, workspaceRoutes);
app.use('/api/workspaces/:workspaceId/pages', apiLimiter, authGuard, pageRoutes);

// ─── 404 catch-all ───────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
});

// ─── Centralized error handler ───────────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀 Nestly server running on http://localhost:${env.PORT}`);
});

export default app;
