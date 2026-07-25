import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  id: string;
  title: string;
  icon: string | null;
}

interface PageBreadcrumbProps {
  breadcrumb: BreadcrumbItem[];
}

/**
 * Breadcrumb component: renders clickable ancestor chain.
 * Each segment navigates to that page.
 */
export default function PageBreadcrumb({ breadcrumb }: PageBreadcrumbProps) {
  const navigate = useNavigate();

  if (!breadcrumb || breadcrumb.length <= 1) {
    return null;
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '24px',
        fontSize: '13px',
        flexWrap: 'wrap',
      }}
    >
      {breadcrumb.map((crumb, i) => {
        const isLast = i === breadcrumb.length - 1;

        return (
          <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {i > 0 && (
              <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>
            )}
            {isLast ? (
              <span
                style={{
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{crumb.icon || '📄'}</span>
                <span>{crumb.title}</span>
              </span>
            ) : (
              <button
                onClick={() => navigate(`/page/${crumb.id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  padding: '2px 4px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <span>{crumb.icon || '📄'}</span>
                <span>{crumb.title}</span>
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
