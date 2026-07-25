import { useCallback, useState, useRef, useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { Block } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import * as pagesApi from '../../api/pages';

type SaveStatus = 'idle' | 'saving' | 'saved';

interface PageEditorProps {
  pageId: string;
  workspaceId: string;
  initialContent: unknown;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

/**
 * BlockNote editor wrapper with debounced autosave.
 * Key prop on pageId ensures re-initialization when navigating between pages.
 */
export default function PageEditor({
  pageId,
  workspaceId,
  initialContent,
  onSaveStatusChange,
}: PageEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setStatus] = useState<SaveStatus>('idle');
  const pageIdRef = useRef(pageId);

  // Keep pageId ref in sync
  useEffect(() => {
    pageIdRef.current = pageId;
  }, [pageId]);

  // Parse initial content: if it's a non-empty array, use it; otherwise let BlockNote default
  const parsedContent = (() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      return initialContent as Block[];
    }
    return undefined;
  })();

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
  });

  // Debounced save callback
  const handleChange = useCallback(() => {
    // Clear any existing debounce timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const content = editor.document;
      const currentPageId = pageIdRef.current;

      setStatus('saving');
      onSaveStatusChange?.('saving');

      try {
        await pagesApi.updatePage(workspaceId, currentPageId, { content });
        setStatus('saved');
        onSaveStatusChange?.('saved');

        // Auto-hide "Saved" after 2 seconds
        if (savedIndicatorRef.current) {
          clearTimeout(savedIndicatorRef.current);
        }
        savedIndicatorRef.current = setTimeout(() => {
          setStatus('idle');
          onSaveStatusChange?.('idle');
        }, 2000);
      } catch {
        setStatus('idle');
        onSaveStatusChange?.('idle');
      }
    }, 800);
  }, [editor, workspaceId, onSaveStatusChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedIndicatorRef.current) clearTimeout(savedIndicatorRef.current);
    };
  }, []);

  return (
    <div style={{ minHeight: '300px' }}>
      <BlockNoteView
        editor={editor}
        theme="dark"
        onChange={handleChange}
      />
    </div>
  );
}
