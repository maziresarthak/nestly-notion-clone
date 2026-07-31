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
      // Refresh sidebar pages
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

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: '620px',
        margin: '0 auto',
        padding: '48px 24px 120px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <span style={{ fontSize: '28px' }}>🗑</span>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Trash
        </h1>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {trashItems.length}
        </span>
      </div>

      {trashItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>✨</span>
          <p style={{ fontSize: '15px' }}>Trash is empty</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {trashItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                transition: 'var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>
                {item.icon || '📄'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '14px',
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
                    fontSize: '12px',
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
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary)', e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-subtle)', e.currentTarget.style.color = 'var(--accent-primary)')}
              >
                Restore
              </button>
              <button
                onClick={() => handlePermanentDelete(item.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--error)',
                  border: '1px solid var(--error)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--error)', e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--error)')}
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
