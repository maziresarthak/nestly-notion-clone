import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePageStore } from '../stores/pageStore';
import * as pagesApi from '../api/pages';
import type { PageFull } from '../api/pages';
import PageHeader from '../components/pages/PageHeader';
import PageBreadcrumb from '../components/pages/PageBreadcrumb';
import DateRangePicker from '../components/pages/DateRangePicker';
import PageEditor from '../components/pages/PageEditor';
import type { VisualSaveState } from '../components/pages/PageEditor';

export default function PageViewPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const workspace = usePageStore((s) => s.workspace);
  const setActivePageId = usePageStore((s) => s.setActivePageId);
  const addPage = usePageStore((s) => s.addPage);
  const expandPage = usePageStore((s) => s.expandPage);
  const [page, setPage] = useState<PageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualState, setVisualState] = useState<VisualSaveState>('idle');

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

  const handleVisualStateChange = useCallback((state: VisualSaveState) => {
    setVisualState(state);
  }, []);

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
      navigate(`/page/${newPage.id}`);
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

  // Determine indicator visibility: only 'saving' and 'saved' are visible
  const isIndicatorVisible = visualState === 'saving' || visualState === 'saved';

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '40px 24px 120px',
        position: 'relative',
      }}
    >
      {/* ─── Save Status Indicator (fixed position, out of flow) ──── */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '24px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          fontSize: '12px',
          color: visualState === 'saving' ? 'var(--text-muted)' : 'var(--success)',
          width: '100px',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: isIndicatorVisible ? 1 : 0,
          transition: 'opacity 0.18s ease',
        }}
      >
        {visualState === 'saving' ? (
          <>
            <div
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid var(--border-default)',
                borderTopColor: 'var(--text-muted)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }}
            />
            <span>Saving…</span>
          </>
        ) : (
          <>
            <span>✓</span>
            <span>Saved</span>
          </>
        )}
      </div>

      <PageBreadcrumb breadcrumb={page.breadcrumb} />

      <PageHeader
        pageId={page.id}
        workspaceId={page.workspaceId}
        initialTitle={page.title}
        initialIcon={page.icon}
      />

      <DateRangePicker
        pageId={page.id}
        workspaceId={page.workspaceId}
        initialStartDate={page.startDate}
        initialEndDate={page.endDate}
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

      {/* ─── BlockNote Editor ──────────────────── */}
      <PageEditor
        key={page.id}
        pageId={page.id}
        workspaceId={page.workspaceId}
        initialContent={page.content}
        onVisualStateChange={handleVisualStateChange}
      />
    </div>
  );
}
