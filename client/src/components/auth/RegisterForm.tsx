import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import * as authApi from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user, accessToken } = await authApi.register({ email, password, name });
      setAuth(user, accessToken);
      toast.success(`Welcome to Nestly, ${user.name}!`);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="register-name"
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          Name
        </label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
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
          htmlFor="register-email"
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          Email
        </label>
        <input
          id="register-email"
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
          htmlFor="register-password"
          style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          Password
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
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
        id="register-submit"
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
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        Already have an account?{' '}
        <Link
          to="/login"
          style={{ color: 'var(--accent-primary)', fontWeight: 500 }}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
