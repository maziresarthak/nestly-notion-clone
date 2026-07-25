import { useCallback, useRef, useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { Block } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import * as pagesApi from '../../api/pages';

/**
 * Visual state machine for the save indicator:
 *   idle → pending → saving → saved → idle
 *
 * - idle:    nothing shown
 * - pending: PATCH has been fired, waiting 350ms before showing "Saving…"
 *            (avoids flash for near-instant saves)
 * - saving:  "Saving…" is visible, enforces a minimum 700ms display time
 * - saved:   "Saved ✓" is visible, holds for 2s then fades to idle
 */
export type VisualSaveState = 'idle' | 'pending' | 'saving' | 'saved';

interface PageEditorProps {
  pageId: string;
  workspaceId: string;
  initialContent: unknown;
  onVisualStateChange?: (state: VisualSaveState) => void;
}

export default function PageEditor({
  pageId,
  workspaceId,
  initialContent,
  onVisualStateChange,
}: PageEditorProps) {
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minSavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageIdRef = useRef(pageId);
  const visualStateRef = useRef<VisualSaveState>('idle');
  const savingShownAtRef = useRef(0);
  const patchCompletedRef = useRef(false);

  useEffect(() => {
    pageIdRef.current = pageId;
  }, [pageId]);

  // Helper: transition visual state
  const setVisualState = useCallback(
    (state: VisualSaveState) => {
      visualStateRef.current = state;
      onVisualStateChange?.(state);
    },
    [onVisualStateChange]
  );

  // Helper: transition to 'saved' state with 2s hold
  const transitionToSaved = useCallback(() => {
    setVisualState('saved');

    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setVisualState('idle');
    }, 2000);
  }, [setVisualState]);

  // Helper: called when PATCH response arrives
  const onPatchComplete = useCallback(() => {
    const currentState = visualStateRef.current;

    if (currentState === 'pending') {
      // PATCH finished within 350ms — skip "Saving…", go straight to "Saved ✓"
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      transitionToSaved();
    } else if (currentState === 'saving') {
      // "Saving…" is visible — enforce minimum 700ms display
      const elapsed = Date.now() - savingShownAtRef.current;
      const remaining = Math.max(0, 700 - elapsed);

      if (remaining === 0) {
        transitionToSaved();
      } else {
        if (minSavingTimerRef.current) clearTimeout(minSavingTimerRef.current);
        minSavingTimerRef.current = setTimeout(() => {
          transitionToSaved();
        }, remaining);
      }
    }
    // If idle (cancelled/navigated away), do nothing
  }, [transitionToSaved]);

  // Parse initial content
  const parsedContent = (() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      return initialContent as Block[];
    }
    return undefined;
  })();

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
  });

  // Debounced save with paced visual state machine
  const handleChange = useCallback(() => {
    // Clear existing debounce
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

    saveDebounceRef.current = setTimeout(async () => {
      const content = editor.document;
      const currentPageId = pageIdRef.current;

      // ── Step 1: Enter 'pending' (not visible yet) ──
      setVisualState('pending');
      patchCompletedRef.current = false;

      // ── Step 2: Start 350ms timer to show "Saving…" ──
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        // Only transition if we're still pending (PATCH not done yet)
        if (visualStateRef.current === 'pending') {
          savingShownAtRef.current = Date.now();
          setVisualState('saving');
        }
      }, 350);

      // ── Step 3: Fire actual PATCH ──
      try {
        await pagesApi.updatePage(workspaceId, currentPageId, { content });
        onPatchComplete();
      } catch {
        // On error, just reset to idle
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        if (minSavingTimerRef.current) clearTimeout(minSavingTimerRef.current);
        setVisualState('idle');
      }
    }, 800);
  }, [editor, workspaceId, setVisualState, onPatchComplete]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      if (minSavingTimerRef.current) clearTimeout(minSavingTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
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
