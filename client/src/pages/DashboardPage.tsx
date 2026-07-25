import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import * as authApi from '../api/auth';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      // Force clear even if API call fails
      clearAuth();
      navigate('/login');
    }
  };

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
          maxWidth: '520px',
          padding: '48px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          textAlign: 'center',
        }}
      >
        {/* Avatar or initials */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: user?.avatarUrl
              ? `url(${user.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: '#fff',
            boxShadow: '0 0 30px rgba(167, 139, 250, 0.2)',
          }}
        >
          {!user?.avatarUrl && (user?.name?.[0]?.toUpperCase() || '?')}
        </div>

        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome to Nestly
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: '8px',
            }}
          >
            Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
            <br />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</span>
          </p>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          Your workspace is ready. Pages, editor, and sidebar are coming in the next milestones.
        </p>

        <button
          id="logout-button"
          onClick={handleLogout}
          style={{
            padding: '10px 28px',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            transition: 'var(--transition-fast)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
