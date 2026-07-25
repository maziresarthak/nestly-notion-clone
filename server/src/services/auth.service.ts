import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, generateRefreshToken, hashToken } from '../lib/jwt.js';
import { env } from '../lib/env.js';
import { AppError } from '../lib/AppError.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/** Strips sensitive fields from a user record for client consumption. */
function toUserDTO(user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

/** Creates a token pair and stores the refresh token hash in the DB. */
async function createTokenPair(userId: string) {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Register a new user with email + password.
 * Creates User + Workspace in a single transaction.
 */
export async function register(email: string, password: string, name: string) {
  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create User + Workspace in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email, passwordHash, name },
    });

    await tx.workspace.create({
      data: { ownerId: newUser.id },
    });

    return newUser;
  });

  const tokens = await createTokenPair(user.id);

  return { user: toUserDTO(user), ...tokens };
}

/**
 * Login with email + password.
 */
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const tokens = await createTokenPair(user.id);

  return { user: toUserDTO(user), ...tokens };
}

/**
 * Google OAuth: verify ID token → find-or-create user.
 * Links Google account to existing email/password user if email matches.
 */
export async function googleAuth(idToken: string) {
  // Verify Google ID token
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Invalid Google ID token');
  }

  if (!payload || !payload.sub || !payload.email) {
    throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Google token missing required fields');
  }

  const { sub: googleId, email, name, picture } = payload;

  // Try to find user by googleId first
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    // Try to find by email (existing email/password user)
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatarUrl: user.avatarUrl || picture },
      });
    } else {
      // Create new user + workspace in transaction
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            googleId,
            name: name || email.split('@')[0],
            avatarUrl: picture,
          },
        });

        await tx.workspace.create({
          data: { ownerId: newUser.id },
        });

        return newUser;
      });
    }
  }

  const tokens = await createTokenPair(user.id);

  return { user: toUserDTO(user), ...tokens };
}

/**
 * Refresh tokens: validate old refresh token → rotate → return new pair.
 */
export async function refreshTokens(oldToken: string) {
  const oldHash = hashToken(oldToken);

  // Find matching valid token
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: oldHash,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }

  // Delete old token (rotation)
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  // Generate new pair
  const tokens = await createTokenPair(stored.userId);

  return tokens;
}

/**
 * Logout: delete the refresh token from DB.
 */
export async function logout(token: string) {
  const tokenHash = hashToken(token);

  // Delete matching token (ignore if not found — idempotent)
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}
