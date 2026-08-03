import apiClient from './client';
import type { ApiSuccess } from '../types';

export interface PageTreeItem {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  sortOrder: string;
  startDate: string | null;
  endDate: string | null;
  hasChildren: boolean;
}

export interface PageFull {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  content: unknown;
  sortOrder: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  breadcrumb: Array<{ id: string; title: string; icon: string | null }>;
}

export interface PageCreated {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  content: unknown;
  sortOrder: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all pages for sidebar (flat list, minimal fields).
 */
export async function getPages(workspaceId: string) {
  const res = await apiClient.get<ApiSuccess<PageTreeItem[]>>(
    `/workspaces/${workspaceId}/pages`
  );
  return res.data.data;
}

/**
 * Get a single page with full content + breadcrumb.
 */
export async function getPage(workspaceId: string, pageId: string) {
  const res = await apiClient.get<ApiSuccess<PageFull>>(
    `/workspaces/${workspaceId}/pages/${pageId}`
  );
  return res.data.data;
}

/**
 * Create a new page.
 */
export async function createPage(
  workspaceId: string,
  data: { parentId?: string; title?: string; icon?: string }
) {
  const res = await apiClient.post<ApiSuccess<PageCreated>>(
    `/workspaces/${workspaceId}/pages`,
    data
  );
  return res.data.data;
}

/**
 * Update a page (title, icon, content, etc.).
 */
export async function updatePage(
  workspaceId: string,
  pageId: string,
  data: {
    title?: string;
    icon?: string | null;
    content?: unknown;
    parentId?: string | null;
    sortOrder?: string;
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  const res = await apiClient.patch<ApiSuccess<PageCreated>>(
    `/workspaces/${workspaceId}/pages/${pageId}`,
    data
  );
  return res.data.data;
}

/**
 * Soft-delete a page.
 */
export async function deletePage(workspaceId: string, pageId: string) {
  const res = await apiClient.delete<ApiSuccess<{ success: boolean }>>(
    `/workspaces/${workspaceId}/pages/${pageId}`
  );
  return res.data.data;
}

// ─── Trash ───────────────────────────────────────────────────

export interface TrashItem {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  deletedAt: string;
}

export async function getTrash(workspaceId: string) {
  const res = await apiClient.get<ApiSuccess<TrashItem[]>>(
    `/workspaces/${workspaceId}/pages/trash`
  );
  return res.data.data;
}

export async function restorePage(workspaceId: string, pageId: string) {
  const res = await apiClient.post<ApiSuccess<PageCreated>>(
    `/workspaces/${workspaceId}/pages/${pageId}/restore`
  );
  return res.data.data;
}

export async function permanentDeletePage(workspaceId: string, pageId: string) {
  const res = await apiClient.delete<ApiSuccess<{ deletedCount: number }>>(
    `/workspaces/${workspaceId}/pages/${pageId}/permanent`
  );
  return res.data.data;
}

// ─── Search ──────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  title: string;
  icon: string | null;
  breadcrumb: Array<{ id: string; title: string; icon: string | null }>;
}

export async function searchPages(workspaceId: string, query: string) {
  const res = await apiClient.get<ApiSuccess<SearchResult[]>>(
    `/workspaces/${workspaceId}/pages/search`,
    { params: { q: query } }
  );
  return res.data.data;
}

