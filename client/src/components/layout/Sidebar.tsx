import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { generateKeyBetween } from 'fractional-indexing';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import * as authApi from '../../api/auth';
import * as pagesApi from '../../api/pages';
import * as workspacesApi from '../../api/workspaces';
import { buildTree, flattenTree, getDescendantIds } from '../../lib/utils';
import PageTreeItem from '../pages/PageTreeItem';

export default function Sidebar() {
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

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Build the tree from flat pages
  const tree = useMemo(() => buildTree(pages), [pages]);
  const flatItems = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds]
  );
  const sortableIds = useMemo(
    () => flatItems.map((item) => item.node.page.id),
    [flatItems]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
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

  // ─── DnD handlers ─────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over || active.id === over.id || !workspace) return;

      const draggedId = active.id as string;
      const targetId = over.id as string;

      const draggedPage = pages.find((p) => p.id === draggedId);
      const targetPage = pages.find((p) => p.id === targetId);
      if (!draggedPage || !targetPage) return;

      // Prevent dropping onto own descendants (cycle)
      const descendantIds = getDescendantIds(draggedId, pages);
      if (descendantIds.has(targetId)) {
        toast.error('Cannot move a page under its own descendant');
        return;
      }

      // Find position in the flat list
      const draggedIdx = flatItems.findIndex((i) => i.node.page.id === draggedId);
      const targetIdx = flatItems.findIndex((i) => i.node.page.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return;

      const targetDepth = flatItems[targetIdx].depth;
      const draggedDepth = flatItems[draggedIdx].depth;

      // Determine the operation:
      // If target is deeper than dragged or same level → re-parent to target's parent and reorder
      // We'll implement simple logic: dropped item goes right after the target as a sibling
      let newParentId = targetPage.parentId;
      let siblings = pages
        .filter((p) => p.parentId === newParentId && p.id !== draggedId && !pages.some(pp => pp.id === p.id && pp.id === draggedId))
        .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));

      // Find the target's position among its siblings
      const targetSiblingIdx = siblings.findIndex((s) => s.id === targetId);

      // Compute new sortOrder — place after the target among its siblings
      let before: string | null = null;
      let after: string | null = null;

      if (targetSiblingIdx >= 0) {
        // If dragging downward: place after target
        if (draggedIdx < targetIdx) {
          before = siblings[targetSiblingIdx]?.sortOrder || null;
          after = siblings[targetSiblingIdx + 1]?.sortOrder || null;
        } else {
          // Dragging upward: place before target
          before = siblings[targetSiblingIdx - 1]?.sortOrder || null;
          after = siblings[targetSiblingIdx]?.sortOrder || null;
        }
      }

      let newSortOrder: string;
      try {
        newSortOrder = generateKeyBetween(before, after);
      } catch {
        // Fallback: just use the target's sort order with a suffix
        newSortOrder = (targetPage.sortOrder || 'a0') + 'V';
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
        // Revert
        const freshPages = await pagesApi.getPages(workspace.id);
        setPages(freshPages);
      }
    },
    [workspace, pages, flatItems, setPages]
  );

  const draggedNode = activeId
    ? flatItems.find((i) => i.node.page.id === activeId)
    : null;

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
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {tree.map((rootNode) => (
                <PageTreeItem key={rootNode.page.id} node={rootNode} depth={0} />
              ))}
            </SortableContext>

            <DragOverlay>
              {draggedNode && (
                <div
                  style={{
                    padding: '4px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--accent-primary)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-primary)',
                    opacity: 0.9,
                  }}
                >
                  <span>{draggedNode.node.page.icon || '📄'}</span>
                  <span>{draggedNode.node.page.title || 'Untitled'}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Drop indicator */}
      {overId && activeId && overId !== activeId && (
        <div
          style={{
            position: 'absolute',
            left: '10px',
            right: '10px',
            height: '2px',
            background: 'var(--accent-primary)',
            borderRadius: '1px',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      )}

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
