import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePageStore } from '../stores/pageStore';
import * as pagesApi from '../api/pages';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Dashboard: empty state or redirect to first page.
 * Shows when user navigates to / inside the AppLayout.
 */
export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const workspace = usePageStore((s) => s.workspace);
  const pages = usePageStore((s) => s.pages);
  const addPage = usePageStore((s) => s.addPage);
  const setActivePageId = usePageStore((s) => s.setActivePageId);
  const navigate = useNavigate();

  const handleCreatePage = async () => {
    if (!workspace) return;
    try {
      const newPage = await pagesApi.createPage(workspace.id, {});
      addPage({
        id: newPage.id,
        parentId: newPage.parentId,
        title: newPage.title,
        icon: newPage.icon,
        sortOrder: newPage.sortOrder,
        startDate: null,
        endDate: null,
        hasChildren: false,
      });
      setActivePageId(newPage.id);
      navigate(`/page/${newPage.id}`);
    } catch {
      toast.error('Failed to create page');
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '500px',
        gap: 'var(--space-6)',
        padding: 'var(--space-10)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
        }}
      >
        ✨
      </div>

      <div>
        <h1
          style={{
            fontSize: 'var(--text-heading)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome to {workspace?.name || 'Nestly'}
        </h1>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', maxWidth: '380px' }}>
          {pages.length === 0
            ? 'Your workspace is empty. Create your first page to get started.'
            : 'Select a page from the sidebar, or create a new one.'}
        </p>
      </div>

      {pages.length === 0 && (
        <button
          id="create-first-page"
          onClick={handleCreatePage}
          style={{
            padding: '10px var(--space-6)',
            fontSize: 'var(--text-body)',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            border: 'none',
            boxShadow: 'var(--shadow-glow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'var(--accent)';
          }}
        >
          Create your first page
        </button>
      )}
    </div>
  );
}
