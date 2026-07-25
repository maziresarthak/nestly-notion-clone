import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';

/**
 * Get all workspaces owned by a user.
 */
export async function getByUserId(userId: string) {
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return workspaces;
}

/**
 * Update a workspace's name. Verifies ownership.
 */
export async function update(
  id: string,
  userId: string,
  data: { name: string }
) {
  // Verify ownership
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace || workspace.ownerId !== userId) {
    throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
  }

  const updated = await prisma.workspace.update({
    where: { id },
    data: { name: data.name },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}
