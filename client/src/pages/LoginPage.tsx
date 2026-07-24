import { Link } from 'react-router-dom'

export default function LoginPage() {
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
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
          <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Nestly
          </span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Welcome back
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          Login page coming in Milestone 2
        </p>

        <Link
          to="/"
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            transition: 'var(--transition-fast)',
            display: 'inline-block',
          }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
