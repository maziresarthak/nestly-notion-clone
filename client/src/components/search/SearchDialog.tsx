import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { usePageStore } from '../../stores/pageStore';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, loading, searched, reset } = useSearch();
  const setActivePageId = usePageStore((s) => s.setActivePageId);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSelect = (pageId: string) => {
    setActivePageId(pageId);
    navigate(`/page/${pageId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Dialog */}
      <div
        className="animate-fade-in-scale"
        style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 101,
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            style={{
              flex: 1,
              fontSize: 'var(--text-body)',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          />
          {loading && (
            <div
              style={{
                width: '14px',
                height: '14px',
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
          <kbd
            style={{
              padding: '2px 6px',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-muted)',
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '340px', overflow: 'auto' }}>
          {!query.trim() ? (
            <div
              style={{
                padding: 'var(--space-10) var(--space-5)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-ui)',
              }}
            >
              Type to search your pages
            </div>
          ) : searched && results.length === 0 && !loading ? (
            <div
              style={{
                padding: 'var(--space-10) var(--space-5)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-ui)',
              }}
            >
              <span style={{ fontSize: '24px', display: 'block', marginBottom: 'var(--space-2)' }}>😕</span>
              No pages found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {result.icon ? (
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{result.icon}</span>
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
                    {(result.title || 'U')[0].toUpperCase()}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-body)',
                      fontWeight: 500,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {result.title || 'Untitled'}
                  </p>
                  {result.breadcrumb.length > 1 && (
                    <p
                      style={{
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-muted)',
                        margin: '2px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {result.breadcrumb.map((b) => b.title).join(' / ')}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
