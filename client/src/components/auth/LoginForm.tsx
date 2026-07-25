import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import * as authApi from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user, accessToken } = await authApi.login({ email, password });
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="login-email"
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          style={{
            padding: '12px 14px',
            fontSize: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            transition: 'var(--transition-fast)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="login-password"
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          style={{
            padding: '12px 14px',
            fontSize: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            transition: 'var(--transition-fast)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
        />
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '12px',
          fontSize: '15px',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)',
          background: isSubmitting
            ? 'var(--bg-hover)'
            : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
          color: '#fff',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'var(--transition-fast)',
          marginTop: '4px',
        }}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        Don't have an account?{' '}
        <Link
          to="/register"
          style={{ color: 'var(--accent-primary)', fontWeight: 500 }}
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
