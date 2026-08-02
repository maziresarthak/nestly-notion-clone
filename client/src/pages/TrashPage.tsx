import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePageStore } from '../stores/pageStore';
import * as pagesApi from '../api/pages';
import type { TrashItem } from '../api/pages';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function TrashPage() {
  useDocumentTitle('Trash');
  const workspace = usePageStore((s) => s.workspace);
  const setPages = usePageStore((s) => s.setPages);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    loadTrash();

    async function loadTrash() {
      setLoading(true);
      try {
        const items = await pagesApi.getTrash(workspace!.id);
        setTrashItems(items);
      } catch {
        toast.error('Failed to load trash');
      } finally {
        setLoading(false);
      }
    }
  }, [workspace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = async (pageId: string) => {
    if (!workspace) return;
    try {
      await pagesApi.restorePage(workspace.id, pageId);
      setTrashItems((prev) => prev.filter((p) => p.id !== pageId));
      const freshPages = await pagesApi.getPages(workspace.id);
      setPages(freshPages);
      toast.success('Page restored');
    } catch {
      toast.error('Failed to restore page');
    }
  };

  const handlePermanentDelete = async (pageId: string) => {
    if (!workspace) return;
    try {
      const result = await pagesApi.permanentDeletePage(workspace.id, pageId);
      setTrashItems((prev) => prev.filter((p) => p.id !== pageId));
      toast.success(`Permanently deleted ${result.deletedCount} page(s)`);
    } catch {
      toast.error('Failed to permanently delete');
    }
  };

  const formatDeletedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
            width: '24px',
            height: '24px',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '620px',
        margin: '0 auto',
        padding: 'var(--space-10) var(--space-6) 120px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Trash
        </h1>
        <span
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--text-muted)',
            background: 'var(--bg-overlay)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 500,
          }}
        >
          {trashItems.length}
        </span>
      </div>

      {trashItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-5)',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: '36px', display: 'block', marginBottom: 'var(--space-3)' }}>✨</span>
          <p style={{ fontSize: 'var(--text-body)' }}>Trash is empty</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {trashItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                transition: 'var(--transition-fast)',
              }}
            >
              {item.icon ? (
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              ) : (
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '5px',
                    background: 'var(--accent-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {(item.title || 'U')[0].toUpperCase()}
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 'var(--text-body)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title || 'Untitled'}
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--text-muted)',
                    margin: '2px 0 0',
                  }}
                >
                  Deleted {formatDeletedDate(item.deletedAt)}
                </p>
              </div>
              <button
                onClick={() => handleRestore(item.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
              >
                Restore
              </button>
              <button
                onClick={() => handlePermanentDelete(item.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-xs)',
                  background: 'transparent',
                  color: 'var(--error)',
                  border: '1px solid rgba(229, 72, 77, 0.3)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}
              >
                Delete forever
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
