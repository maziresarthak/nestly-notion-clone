import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';

/**
 * Get user by ID. Excludes passwordHash from result.
 */
export async function getById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return user;
}

/**
 * Update user profile (name, avatarUrl).
 */
export async function update(id: string, data: { name?: string; avatarUrl?: string }) {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return user;
}
