import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Verify that a workspace belongs to the given user.
 * Returns the workspace or throws 404.
 */
async function verifyWorkspaceOwnership(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace || workspace.ownerId !== userId) {
    throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
  }

  return workspace;
}

/**
 * Verify that a page belongs to a workspace owned by the given user.
 * Returns the page or throws 404.
 */
async function verifyPageOwnership(pageId: string, userId: string) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { workspace: true },
  });

  if (!page || page.workspace.ownerId !== userId) {
    throw new AppError(404, 'PAGE_NOT_FOUND', 'Page not found');
  }

  return page;
}

/**
 * Compute breadcrumb: walk up the parentId chain collecting { id, title, icon }.
 * Returns root-first order.
 */
async function computeBreadcrumb(pageId: string): Promise<Array<{ id: string; title: string; icon: string | null }>> {
  const breadcrumb: Array<{ id: string; title: string; icon: string | null }> = [];
  let currentId: string | null = pageId;

  // Walk up the chain (max 50 to prevent infinite loops)
  let depth = 0;
  while (currentId && depth < 50) {
    const page: { id: string; title: string; icon: string | null; parentId: string | null } | null = await prisma.page.findUnique({
      where: { id: currentId },
      select: { id: true, title: true, icon: true, parentId: true },
    });

    if (!page) break;

    breadcrumb.push({ id: page.id, title: page.title, icon: page.icon });
    currentId = page.parentId;
    depth++;
  }

  // Reverse so it goes root → current
  return breadcrumb.reverse();
}

// ─── Service Methods ─────────────────────────────────────────

/**
 * List all non-deleted pages in a workspace (minimal fields for sidebar).
 */
export async function list(workspaceId: string, userId: string) {
  await verifyWorkspaceOwnership(workspaceId, userId);

  const pages = await prisma.page.findMany({
    where: {
      workspaceId,
      isDeleted: false,
    },
    select: {
      id: true,
      parentId: true,
      title: true,
      icon: true,
      sortOrder: true,
      startDate: true,
      endDate: true,
      children: {
        where: { isDeleted: false },
        select: { id: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Map to PageTreeItem shape with hasChildren boolean
  return pages.map((p) => ({
    id: p.id,
    parentId: p.parentId,
    title: p.title,
    icon: p.icon,
    sortOrder: p.sortOrder,
    startDate: p.startDate,
    endDate: p.endDate,
    hasChildren: p.children.length > 0,
  }));
}

/**
 * Get a single page by ID with full content and breadcrumb.
 */
export async function getById(pageId: string, userId: string) {
  const page = await verifyPageOwnership(pageId, userId);

  if (page.isDeleted) {
    throw new AppError(404, 'PAGE_NOT_FOUND', 'Page not found');
  }

  const breadcrumb = await computeBreadcrumb(pageId);

  return {
    id: page.id,
    workspaceId: page.workspaceId,
    parentId: page.parentId,
    title: page.title,
    icon: page.icon,
    content: page.content,
    sortOrder: page.sortOrder,
    startDate: page.startDate,
    endDate: page.endDate,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    breadcrumb,
  };
}

/**
 * Create a new page in a workspace.
 */
export async function create(
  workspaceId: string,
  userId: string,
  data: { parentId?: string; title?: string; icon?: string }
) {
  await verifyWorkspaceOwnership(workspaceId, userId);

  // If parentId is provided, verify it belongs to the same workspace
  if (data.parentId) {
    const parent = await prisma.page.findUnique({
      where: { id: data.parentId },
    });
    if (!parent || parent.workspaceId !== workspaceId || parent.isDeleted) {
      throw new AppError(404, 'PARENT_NOT_FOUND', 'Parent page not found');
    }
  }

  // Compute sortOrder: find the last sibling and place after it
  const lastSibling = await prisma.page.findFirst({
    where: {
      workspaceId,
      parentId: data.parentId || null,
      isDeleted: false,
    },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  // Simple sortOrder: increment last character or append
  let sortOrder = 'a0';
  if (lastSibling) {
    // Simple increment strategy for v1
    sortOrder = lastSibling.sortOrder + 'V';
  }

  const page = await prisma.page.create({
    data: {
      workspaceId,
      parentId: data.parentId || null,
      title: data.title || 'Untitled',
      icon: data.icon || null,
      sortOrder,
    },
  });

  return page;
}

/**
 * Update a page (title, icon, content, parentId, sortOrder, dates).
 */
export async function update(
  pageId: string,
  userId: string,
  data: {
    title?: string;
    icon?: string;
    content?: unknown;
    parentId?: string | null;
    sortOrder?: string;
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  const page = await verifyPageOwnership(pageId, userId);

  if (page.isDeleted) {
    throw new AppError(404, 'PAGE_NOT_FOUND', 'Page not found');
  }

  // Validate date range if both are set
  const startDate = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined;
  const endDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined;

  const effectiveStart = startDate !== undefined ? startDate : page.startDate;
  const effectiveEnd = endDate !== undefined ? endDate : page.endDate;

  if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
    throw new AppError(422, 'INVALID_DATE_RANGE', 'End date must be after start date');
  }

  // If re-parenting, verify new parent belongs to same workspace
  if (data.parentId !== undefined && data.parentId !== null) {
    const newParent = await prisma.page.findUnique({
      where: { id: data.parentId },
    });
    if (!newParent || newParent.workspaceId !== page.workspaceId || newParent.isDeleted) {
      throw new AppError(404, 'PARENT_NOT_FOUND', 'Parent page not found');
    }
    // Prevent circular: can't parent to self or own descendant
    if (data.parentId === pageId) {
      throw new AppError(422, 'CIRCULAR_PARENT', 'Cannot set page as its own parent');
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.parentId !== undefined) updateData.parentId = data.parentId;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;

  const updated = await prisma.page.update({
    where: { id: pageId },
    data: updateData,
  });

  return updated;
}

/**
 * Soft-delete a page: set isDeleted=true, deletedAt=now().
 */
export async function softDelete(pageId: string, userId: string) {
  const page = await verifyPageOwnership(pageId, userId);

  if (page.isDeleted) {
    throw new AppError(404, 'PAGE_NOT_FOUND', 'Page not found');
  }

  const deleted = await prisma.page.update({
    where: { id: pageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return deleted;
}
