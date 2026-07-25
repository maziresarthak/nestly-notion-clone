import apiClient from './client';
import type { ApiSuccess } from '../types';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all workspaces for the current user.
 */
export async function getWorkspaces() {
  const res = await apiClient.get<ApiSuccess<Workspace[]>>('/workspaces');
  return res.data.data;
}

/**
 * Update a workspace's name.
 */
export async function updateWorkspace(id: string, data: { name: string }) {
  const res = await apiClient.patch<ApiSuccess<Workspace>>(`/workspaces/${id}`, data);
  return res.data.data;
}
