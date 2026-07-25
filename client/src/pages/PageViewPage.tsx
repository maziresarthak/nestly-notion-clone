import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePageStore } from '../stores/pageStore';
import * as pagesApi from '../api/pages';
import type { PageFull } from '../api/pages';
import PageHeader from '../components/pages/PageHeader';

export default function PageViewPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const workspace = usePageStore((s) => s.workspace);
  const setActivePageId = usePageStore((s) => s.setActivePageId);
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
      {/* Breadcrumb */}
      {page.breadcrumb && page.breadcrumb.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          {page.breadcrumb.map((crumb, i) => (
            <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {i > 0 && <span style={{ margin: '0 2px' }}>/</span>}
              <span>{crumb.icon || '📄'}</span>
              <span
                style={{
                  color: i === page.breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {crumb.title}
              </span>
            </span>
          ))}
        </div>
      )}

      <PageHeader
        pageId={page.id}
        workspaceId={page.workspaceId}
        initialTitle={page.title}
        initialIcon={page.icon}
      />

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
