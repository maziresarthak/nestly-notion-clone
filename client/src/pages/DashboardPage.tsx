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
        gap: '24px',
        padding: '48px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
        }}
      >
        ✨
      </div>

      <div>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          Welcome to {workspace?.name || 'Nestly'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
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
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            border: 'none',
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(167, 139, 250, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(167, 139, 250, 0.2)';
          }}
        >
          Create your first page
        </button>
      )}
    </div>
  );
}
