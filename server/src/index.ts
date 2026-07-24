import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './lib/AppError.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/health', healthRoutes);

// ─── 404 catch-all ───────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
});

// ─── Centralized error handler ───────────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Nestly server running on http://localhost:${PORT}`);
});

export default app;
