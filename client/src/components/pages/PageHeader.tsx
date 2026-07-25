import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import * as pagesApi from '../../api/pages';
import { usePageStore } from '../../stores/pageStore';

interface PageHeaderProps {
  pageId: string;
  workspaceId: string;
  initialTitle: string;
  initialIcon: string | null;
}

/**
 * Editable page title + icon. Title auto-saves with 800ms debounce.
 */
export default function PageHeader({
  pageId,
  workspaceId,
  initialTitle,
  initialIcon,
}: PageHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [icon, setIcon] = useState(initialIcon || '📄');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const updatePage = usePageStore((s) => s.updatePage);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Sync from props when page changes
  useEffect(() => {
    setTitle(initialTitle);
    setIcon(initialIcon || '📄');
  }, [pageId, initialTitle, initialIcon]);

  // Debounced title save
  const debouncedSave = useCallback(
    (newTitle: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await pagesApi.updatePage(workspaceId, pageId, { title: newTitle });
        } catch {
          toast.error('Failed to save title');
        }
      }, 800);
    },
    [workspaceId, pageId]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Update sidebar immediately (optimistic)
    updatePage(pageId, { title: newTitle || 'Untitled' });
    // Save to server with debounce
    debouncedSave(newTitle || 'Untitled');
  };

  const handleIconChange = async (newIcon: string) => {
    setIcon(newIcon || '📄');
    setShowIconPicker(false);
    updatePage(pageId, { icon: newIcon || null });
    try {
      await pagesApi.updatePage(workspaceId, pageId, { icon: newIcon || null });
    } catch {
      toast.error('Failed to save icon');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Common emoji set for quick picking
  const quickEmojis = ['📄', '📝', '📋', '🎯', '💡', '🔥', '⭐', '📌', '🏠', '📚', '🎨', '⚡', '🚀', '💻', '📊', '🎵'];

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Icon */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <button
          onClick={() => setShowIconPicker(!showIconPicker)}
          style={{
            fontSize: '48px',
            lineHeight: 1,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          title="Change icon"
        >
          {icon}
        </button>

        {/* Simple emoji picker */}
        {showIconPicker && (
          <>
            <div
              onClick={() => setShowIconPicker(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '60px',
                left: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 11,
                width: '240px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '4px',
                  marginBottom: '8px',
                }}
              >
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleIconChange(emoji)}
                    style={{
                      fontSize: '18px',
                      padding: '4px',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Custom emoji input */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  ref={iconInputRef}
                  type="text"
                  placeholder="Type emoji…"
                  maxLength={4}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && iconInputRef.current) {
                      handleIconChange(iconInputRef.current.value);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (iconInputRef.current) handleIconChange(iconInputRef.current.value);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Set
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Title */}
      <input
        id="page-title-input"
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        style={{
          width: '100%',
          fontSize: '40px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          background: 'none',
          border: 'none',
          outline: 'none',
          padding: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}
      />
    </div>
  );
}
