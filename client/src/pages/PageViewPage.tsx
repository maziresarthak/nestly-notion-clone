import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePageStore } from '../stores/pageStore';
import * as pagesApi from '../api/pages';
import type { PageFull } from '../api/pages';
import PageHeader from '../components/pages/PageHeader';
import PageBreadcrumb from '../components/pages/PageBreadcrumb';

export default function PageViewPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const workspace = usePageStore((s) => s.workspace);
  const setActivePageId = usePageStore((s) => s.setActivePageId);
  const addPage = usePageStore((s) => s.addPage);
  const expandPage = usePageStore((s) => s.expandPage);
  const [page, setPage] = useState<PageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId || !workspace) return;

    setActivePageId(pageId);
    loadPage();

    async function loadPage() {
      setLoading(true);
      setError(null);
      try {
        const data = await pagesApi.getPage(workspace!.id, pageId!);
        setPage(data);
      } catch {
        setError('Page not found');
      } finally {
        setLoading(false);
      }
    }

    return () => {
      setActivePageId(null);
    };
  }, [pageId, workspace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Create sub-page from page view ─────────────
  const handleCreateSubPage = async () => {
    if (!workspace || !page) return;
    try {
      const newPage = await pagesApi.createPage(workspace.id, {
        parentId: page.id,
      });
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
      expandPage(page.id);
      setActivePageId(newPage.id);
      // Navigate by updating URL
      window.history.pushState(null, '', `/page/${newPage.id}`);
      // Reload the page component
      setPage(null);
      setLoading(true);
      const data = await pagesApi.getPage(workspace.id, newPage.id);
      setPage(data);
      setLoading(false);
      toast.success('Sub-page created');
    } catch {
      toast.error('Failed to create sub-page');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '400px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '400px',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '40px' }}>😕</span>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
          {error || 'Page not found'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '60px 24px 120px',
      }}
    >
      <PageBreadcrumb breadcrumb={page.breadcrumb} />

      <PageHeader
        pageId={page.id}
        workspaceId={page.workspaceId}
        initialTitle={page.title}
        initialIcon={page.icon}
      />

      {/* Add sub-page button */}
      <button
        onClick={handleCreateSubPage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          background: 'none',
          border: '1px dashed var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
          marginBottom: '24px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <span>+</span> Add sub-page
      </button>

      {/* Editor placeholder */}
      <div
        style={{
          padding: '16px 0',
          fontSize: '15px',
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}
      >
        <p>Start writing here… (Rich editor coming in Milestone 5)</p>
      </div>
    </div>
  );
}
