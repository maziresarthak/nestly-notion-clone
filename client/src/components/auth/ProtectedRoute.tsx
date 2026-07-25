import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import * as authApi from '../../api/auth';

/**
 * Protected route wrapper.
 * - If authenticated → render children (Outlet).
 * - If loading → show spinner (silent refresh in progress).
 * - If not authenticated → redirect to /login.
 *
 * On initial mount, attempts a silent refresh to restore the session
 * from the HttpOnly refresh cookie.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    // Only attempt silent refresh if we're in the loading state
    // and not already authenticated
    if (isLoading && !isAuthenticated) {
      attemptSilentRefresh();
    }

    async function attemptSilentRefresh() {
      try {
        // Try to get a new access token using the refresh cookie
        const { accessToken } = await authApi.refresh();
        // If successful, fetch the user profile
        const user = await authApi.getMe();
        setAuth(user, accessToken);
      } catch {
        // Refresh failed — no valid session
        clearAuth();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Spinning loader */}
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--border-default)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
