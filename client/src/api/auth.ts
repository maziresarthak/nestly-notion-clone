import apiClient from './client';
import type { ApiSuccess, AuthResponse, RefreshResponse } from '../types';

/**
 * Register a new user with email + password.
 */
export async function register(data: { email: string; password: string; name: string }) {
  const res = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/register', data);
  return res.data.data;
}

/**
 * Login with email + password.
 */
export async function login(data: { email: string; password: string }) {
  const res = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/login', data);
  return res.data.data;
}

/**
 * Login/register via Google ID token.
 */
export async function googleLogin(idToken: string) {
  const res = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/google', { idToken });
  return res.data.data;
}

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 */
export async function refresh() {
  const res = await apiClient.post<ApiSuccess<RefreshResponse>>('/auth/refresh');
  return res.data.data;
}

/**
 * Logout — revoke refresh token and clear cookie.
 */
export async function logout() {
  await apiClient.post('/auth/logout');
}

/**
 * Get current user profile.
 */
export async function getMe() {
  const res = await apiClient.get<ApiSuccess<AuthResponse['user']>>('/users/me');
  return res.data.data;
}
