import LoginForm from '../components/auth/LoginForm';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If already logged in, redirect to dashboard
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
        background: 'var(--bg-primary)',
        padding: '24px',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #a78bfa, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Nestly
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Sign in to your account to continue
          </p>
        </div>

        <LoginForm />
        <GoogleSignInButton />
      </div>
    </div>
  );
}
