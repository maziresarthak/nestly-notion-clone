import axios from 'axios';
import { API_BASE_URL } from '../lib/constants';
import { useAuthStore } from '../stores/authStore';

/**
 * Axios instance for all API calls.
 * - Request interceptor: attaches Bearer token from Zustand store.
 * - Response interceptor: on 401, attempts one silent refresh then retries.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies (refresh token)
});

// ─── Request Interceptor ────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response Interceptor (auto-refresh on 401) ─────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 errors, skip if already retried or if it's a refresh/login/register request
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/google')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue up requests while refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt silent refresh — uses the HttpOnly cookie
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = data.data.accessToken;
      useAuthStore.getState().setAccessToken(newAccessToken);

      processQueue(null, newAccessToken);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — clear auth state, redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
