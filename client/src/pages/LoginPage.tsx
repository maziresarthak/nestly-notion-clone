import LoginForm from '../components/auth/LoginForm';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Login');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-canvas)',
        padding: 'var(--space-6)',
      }}
    >
      <div
        className="animate-fade-in-scale"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-active))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: 'var(--text-heading)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Nestly
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Sign in to your workspace
          </p>
        </div>

        <LoginForm />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <GoogleSignInButton />

        <p style={{ textAlign: 'center', fontSize: 'var(--text-ui)', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
