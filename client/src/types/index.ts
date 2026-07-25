// ─── Shared TypeScript interfaces ─────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

/** Standard API success envelope */
export interface ApiSuccess<T> {
  data: T;
}

/** Standard API error envelope */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
