import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import * as pagesApi from '../../api/pages';
import { usePageStore } from '../../stores/pageStore';

interface PageHeaderProps {
  pageId: string;
  workspaceId: string;
  initialTitle: string;
  initialIcon: string | null;
}

/**
 * Editable page title + icon with emoji-mart picker.
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
    updatePage(pageId, { title: newTitle || 'Untitled' });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmojiSelect = (emoji: any) => {
    handleIconChange(emoji.native);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

        {/* Emoji picker popover */}
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
                zIndex: 11,
              }}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                set="native"
                maxFrequentRows={2}
              />
              {/* Direct text input fallback */}
              <div
                style={{
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  padding: 'var(--space-2) var(--space-3)',
                  display: 'flex',
                  gap: 'var(--space-2)',
                }}
              >
                <input
                  ref={iconInputRef}
                  type="text"
                  placeholder="Paste emoji…"
                  maxLength={4}
                  style={{
                    flex: 1,
                    padding: '5px var(--space-2)',
                    fontSize: 'var(--text-body)',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
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
                    padding: '5px 10px',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--accent)',
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
          fontSize: 'var(--text-page-title)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          background: 'none',
          border: 'none',
          outline: 'none',
          padding: 0,
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
        }}
      />
    </div>
  );
}
