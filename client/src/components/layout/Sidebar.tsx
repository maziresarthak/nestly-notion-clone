import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { generateKeyBetween } from 'fractional-indexing';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import * as authApi from '../../api/auth';
import * as pagesApi from '../../api/pages';
import * as workspacesApi from '../../api/workspaces';
import { buildTree, flattenTree, getDescendantIds } from '../../lib/utils';
import PageTreeItem from '../pages/PageTreeItem';
import type { DropIndicator } from '../pages/PageTreeItem';

interface SidebarProps {
  onOpenSearch?: () => void;
}

export default function Sidebar({ onOpenSearch }: SidebarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const workspace = usePageStore((s) => s.workspace);
  const pages = usePageStore((s) => s.pages);
  const expandedIds = usePageStore((s) => s.expandedIds);
  const setWorkspace = usePageStore((s) => s.setWorkspace);
  const addPage = usePageStore((s) => s.addPage);
  const setPages = usePageStore((s) => s.setPages);
  const setActivePageId = usePageStore((s) => s.setActivePageId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // DnD state — Notion style
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const pointerYRef = useRef(0);

  // Build the tree from flat pages
  const tree = useMemo(() => buildTree(pages), [pages]);
  const flatItems = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds]
  );

  // Track pointer position during drag
  useEffect(() => {
    if (!activeId) return;
    const handler = (e: MouseEvent) => {
      pointerYRef.current = e.clientY;
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [activeId]);

  // DnD sensors — 5px activation distance to distinguish click vs drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Sync workspace name
  useEffect(() => {
    if (workspace) setWorkspaceName(workspace.name);
  }, [workspace?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // ─── Workspace rename ──────────────────────────────
  const handleRenameSubmit = async () => {
    setIsEditingName(false);
    if (!workspace || !workspaceName.trim() || workspaceName === workspace.name) {
      if (workspace) setWorkspaceName(workspace.name);
      return;
    }
    try {
      const updated = await workspacesApi.updateWorkspace(workspace.id, { name: workspaceName.trim() });
      setWorkspace(updated);
      toast.success('Workspace renamed');
    } catch {
      toast.error('Failed to rename workspace');
      setWorkspaceName(workspace.name);
    }
  };

  // ─── Create root page ─────────────────────────────
  const handleCreatePage = async () => {
    if (!workspace) return;
    try {
      const newPage = await pagesApi.createPage(workspace.id, {});
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
      setActivePageId(newPage.id);
      navigate(`/page/${newPage.id}`);
    } catch {
      toast.error('Failed to create page');
    }
  };

  // ─── Logout ────────────────────────────────────────
  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  // ─── DnD: drag start ──────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // ─── DnD: drag over — compute drop indicator ─────
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;

      if (!over || !activeId) {
        setDropIndicator(null);
        return;
      }

      const targetId = over.id as string;

      // Don't indicate drop on self
      if (targetId === activeId) {
        setDropIndicator(null);
        return;
      }

      // Prevent dropping onto own descendants (cycle detection)
      const descendantIds = getDescendantIds(activeId, pages);
      if (descendantIds.has(targetId)) {
        setDropIndicator(null);
        return;
      }

      // Get the over element's DOM rect
      const overElement = document.querySelector(`[data-page-id="${targetId}"]`);
      if (!overElement) {
        setDropIndicator(null);
        return;
      }

      const rect = overElement.getBoundingClientRect();
      const pointerY = pointerYRef.current;
      const relativeY = pointerY - rect.top;
      const height = rect.height;

      // Top 30% → above, Bottom 30% → below, Middle 40% → inside (re-parent)
      let position: 'above' | 'below' | 'inside';
      if (relativeY < height * 0.3) {
        position = 'above';
      } else if (relativeY > height * 0.7) {
        position = 'below';
      } else {
        position = 'inside';
      }

      setDropIndicator({ targetId, position });
    },
    [activeId, pages]
  );

  // ─── DnD: drag end — compute new parentId + sortOrder ─
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const draggedId = activeId;
      const indicator = dropIndicator;

      // Clear state immediately
      setActiveId(null);
      setDropIndicator(null);

      if (!draggedId || !indicator || !workspace) return;

      const { targetId, position } = indicator;
      const targetPage = pages.find((p) => p.id === targetId);
      if (!targetPage) return;

      // Cycle detection: already blocked in handleDragOver, but double-check
      const descendantIds = getDescendantIds(draggedId, pages);
      if (descendantIds.has(targetId)) {
        toast.error('Cannot move a page under its own descendant');
        return;
      }

      let newParentId: string | null;
      let newSortOrder: string;

      if (position === 'inside') {
        // Re-parent: make dragged a child of target (first child)
        newParentId = targetId;
        const targetChildren = pages
          .filter((p) => p.parentId === targetId && p.id !== draggedId)
          .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));

        try {
          newSortOrder = generateKeyBetween(null, targetChildren[0]?.sortOrder || null);
        } catch {
          newSortOrder = 'a0';
        }
      } else {
        // Reorder as sibling: place above or below target
        newParentId = targetPage.parentId;
        const siblings = pages
          .filter((p) => p.parentId === newParentId && p.id !== draggedId)
          .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));

        const targetIdx = siblings.findIndex((s) => s.id === targetId);

        let before: string | null = null;
        let after: string | null = null;

        if (position === 'above') {
          // Place before target
          before = targetIdx > 0 ? siblings[targetIdx - 1].sortOrder : null;
          after = siblings[targetIdx]?.sortOrder || null;
        } else {
          // 'below': place after target
          before = siblings[targetIdx]?.sortOrder || null;
          after = targetIdx < siblings.length - 1 ? siblings[targetIdx + 1].sortOrder : null;
        }

        try {
          newSortOrder = generateKeyBetween(before, after);
        } catch {
          newSortOrder = (targetPage.sortOrder || 'a0') + 'V';
        }
      }

      // Optimistic update
      const updatedPages = pages.map((p) =>
        p.id === draggedId
          ? { ...p, parentId: newParentId, sortOrder: newSortOrder }
          : p
      );
      setPages(updatedPages);

      // Persist
      try {
        await pagesApi.updatePage(workspace.id, draggedId, {
          parentId: newParentId,
          sortOrder: newSortOrder,
        });
      } catch {
        toast.error('Failed to move page');
        // Revert — re-fetch from server
        const freshPages = await pagesApi.getPages(workspace.id);
        setPages(freshPages);
      }
    },
    [activeId, dropIndicator, workspace, pages, setPages]
  );

  // ─── DnD: drag cancel ─────────────────────────────
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDropIndicator(null);
  }, []);

  // Get the active item for the drag overlay
  const activePage = activeId ? pages.find((p) => p.id === activeId) : null;

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ─── Workspace Header ──────────────────────── */}
      <div
        style={{
          padding: '16px 14px 12px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setIsEditingName(false);
                if (workspace) setWorkspaceName(workspace.name);
              }
            }}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent-primary)',
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditingName(true)}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Click to rename workspace"
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #a78bfa, #6d28d9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              N
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspace?.name || 'Workspace'}
            </span>
          </div>
        )}
      </div>

      {/* ─── New Page Button ──────────────────────────── */}
      <div style={{ padding: '8px 10px 4px' }}>
        <button
          id="new-page-button"
          onClick={handleCreatePage}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-fast)',
            border: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          New page
        </button>
      </div>

      {/* ─── Tree / Page List ────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '4px 6px',
        }}
      >
        {pages.length === 0 ? (
          <p
            style={{
              padding: '20px 12px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            No pages yet. Click + to create one.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {tree.map((rootNode) => (
              <PageTreeItem
                key={rootNode.page.id}
                node={rootNode}
                depth={0}
                activeId={activeId}
                dropIndicator={dropIndicator}
              />
            ))}

            {/* Floating drag overlay — follows cursor */}
            <DragOverlay dropAnimation={null}>
              {activePage && (
                <div
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--accent-primary)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-primary)',
                    opacity: 0.9,
                    width: '200px',
                    pointerEvents: 'none',
                  }}
                >
                  <span>{activePage.icon || '📄'}</span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activePage.title || 'Untitled'}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ─── Search + Trash Links ───────────────────── */}
      <div style={{ padding: '4px 10px', borderTop: '1px solid var(--border-default)' }}>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            style={{
              width: '100%',
              padding: '6px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-fast)',
              border: 'none',
              marginBottom: '2px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: '14px' }}>🔍</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
            <kbd
              style={{
                padding: '1px 5px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                borderRadius: '3px',
                border: '1px solid var(--border-default)',
              }}
            >
              ⌘K
            </kbd>
          </button>
        )}
        <button
          onClick={() => navigate('/trash')}
          style={{
            width: '100%',
            padding: '6px 12px',
            fontSize: '13px',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-fast)',
            border: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: '14px' }}>🗑</span>
          Trash
        </button>
      </div>

      {/* ─── User Profile / Logout ─────────────────── */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: user?.avatarUrl
              ? `url(${user.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {!user?.avatarUrl && (user?.name?.[0]?.toUpperCase() || '?')}
        </div>
        <span
          style={{
            flex: 1,
            fontSize: '13px',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.name || 'User'}
        </span>
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          title="Log out"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ↪
        </button>
      </div>
    </aside>
  );
}
