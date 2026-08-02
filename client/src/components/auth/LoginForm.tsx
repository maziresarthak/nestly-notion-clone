import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as authApi from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--text-body)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-canvas)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  transition: 'var(--transition-fast)',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-ui)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="login-email" style={labelStyle}>Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label htmlFor="login-password" style={labelStyle}>Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '10px',
          fontSize: 'var(--text-body)',
          fontWeight: 600,
          borderRadius: 'var(--radius-sm)',
          background: isSubmitting
            ? 'var(--bg-hover)'
            : 'var(--accent)',
          color: '#fff',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'var(--transition-fast)',
          marginTop: 'var(--space-1)',
          border: 'none',
        }}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
