import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          maxWidth: '640px',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #a78bfa, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 30px rgba(167,139,250,0.25)',
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Nestly
          </span>
        </div>

        {/* Tagline */}
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          Your ideas,{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            beautifully nested
          </span>
        </h1>

        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxWidth: '480px',
          }}
        >
          A minimal, powerful workspace for notes, docs, and projects.
          Organize everything with infinite nesting, rich editing, and a
          stunning dark interface.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '8px',
          }}
        >
          <Link
            to="/register"
            id="cta-signup"
            style={{
              padding: '14px 36px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              color: '#fff',
              transition: 'var(--transition-fast)',
              boxShadow: '0 0 20px rgba(167,139,250,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(167,139,250,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(167,139,250,0.2)'
            }}
          >
            Get started free
          </Link>

          <Link
            to="/login"
            id="cta-login"
            style={{
              padding: '14px 36px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.borderColor = 'var(--border-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.borderColor = 'var(--border-default)'
            }}
          >
            Log in
          </Link>
        </div>

        {/* Subtle footer note */}
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '24px',
          }}
        >
          No credit card required · Free forever for personal use
        </p>
      </div>
    </div>
  )
}
