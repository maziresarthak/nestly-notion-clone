import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { usePageStore } from '../../stores/pageStore';
import * as pagesApi from '../../api/pages';
import type { TreeNode } from '../../lib/utils';

export interface DropIndicator {
  targetId: string;
  position: 'above' | 'below' | 'inside';
}

interface PageTreeItemProps {
  node: TreeNode;
  depth: number;
  activeId: string | null;
  dropIndicator: DropIndicator | null;
}

function formatDateBadge(startDate: string | null, endDate: string | null): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (startDate && endDate) {
    return `${fmt(startDate)} → ${fmt(endDate)}`;
  }
  if (startDate) return fmt(startDate);
  if (endDate) return fmt(endDate);
  return '';
}

export default function PageTreeItem({ node, depth, activeId, dropIndicator }: PageTreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = usePageStore((s) => s.workspace);
  const expandedIds = usePageStore((s) => s.expandedIds);
  const toggleExpanded = usePageStore((s) => s.toggleExpanded);
  const expandPage = usePageStore((s) => s.expandPage);
  const addPage = usePageStore((s) => s.addPage);
  const removePage = usePageStore((s) => s.removePage);
  const setActivePageId = usePageStore((s) => s.setActivePageId);
  const pages = usePageStore((s) => s.pages);

  const [isHovered, setIsHovered] = useState(false);

  const page = node.page;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(page.id);
  const urlPageId = location.pathname.startsWith('/page/')
    ? location.pathname.split('/page/')[1]
    : null;
  const isActive = page.id === urlPageId;
  const isDragging = activeId === page.id;

  // Is this item the drop target for the indicator?
  const isDropAbove = dropIndicator?.targetId === page.id && dropIndicator.position === 'above';
  const isDropBelow = dropIndicator?.targetId === page.id && dropIndicator.position === 'below';
  const isDropInside = dropIndicator?.targetId === page.id && dropIndicator.position === 'inside';

  // ─── DnD: draggable ─────────────────────────────
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({
    id: page.id,
    data: { type: 'page', page, depth },
  });

  // ─── DnD: droppable ─────────────────────────────
  const {
    setNodeRef: setDropRef,
  } = useDroppable({
    id: page.id,
    data: { type: 'page', page, depth },
  });

  // Merge refs
  const setNodeRef = (el: HTMLElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const handleClick = () => {
    setActivePageId(page.id);
    navigate(`/page/${page.id}`);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(page.id);
  };

  const handleCreateSubPage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspace) return;
    try {
      const newPage = await pagesApi.createPage(workspace.id, {
        parentId: page.id,
      });
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
      expandPage(page.id);
      setActivePageId(newPage.id);
      navigate(`/page/${newPage.id}`);
    } catch {
      toast.error('Failed to create sub-page');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspace) return;
    try {
      await pagesApi.deletePage(workspace.id, page.id);
      removePage(page.id);
      toast.success('Page moved to trash');
      if (urlPageId === page.id) {
        const remaining = pages.filter((p) => p.id !== page.id);
        if (remaining.length > 0) {
          navigate(`/page/${remaining[0].id}`);
        } else {
          navigate('/');
        }
      }
    } catch {
      toast.error('Failed to delete page');
    }
  };

  const indentPx = 12 + depth * 16;

  return (
    <>
      {/* Drop indicator line: ABOVE */}
      {isDropAbove && (
        <div
          style={{
            height: '2px',
            background: 'var(--accent-primary)',
            borderRadius: '1px',
            marginLeft: `${indentPx}px`,
            marginRight: '8px',
            marginBottom: '-1px',
            position: 'relative',
            zIndex: 20,
          }}
        />
      )}

      {/* The page item */}
      <div
        ref={setNodeRef}
        data-page-id={page.id}
        style={{
          paddingLeft: `${indentPx}px`,
          paddingRight: '8px',
          paddingTop: '4px',
          paddingBottom: '4px',
          fontSize: '13px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: isDropInside
            ? 'rgba(139, 92, 246, 0.15)'
            : isActive
            ? 'var(--accent-subtle)'
            : isHovered && !activeId
            ? 'var(--bg-hover)'
            : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'background 0.1s',
          marginBottom: '1px',
          position: 'relative',
          userSelect: 'none',
          opacity: isDragging ? 0.4 : 1,
          outline: isDropInside ? '2px solid var(--accent-primary)' : 'none',
          outlineOffset: '-2px',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
        {...listeners}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={handleToggleExpand}
          style={{
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '10px',
            flexShrink: 0,
            borderRadius: '2px',
            transition: 'transform 0.15s ease',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          ▶
        </button>

        {/* Icon */}
        <span style={{ fontSize: '14px', flexShrink: 0 }}>
          {page.icon || '📄'}
        </span>

        {/* Title */}
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            marginLeft: '4px',
          }}
        >
          {page.title || 'Untitled'}
        </span>

        {/* Date badge */}
        {(page.startDate || page.endDate) && !isHovered && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              padding: '1px 5px',
              borderRadius: '3px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {formatDateBadge(page.startDate, page.endDate)}
          </span>
        )}

        {/* Hover actions (hide during drag) */}
        {isHovered && !activeId && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <button
              onClick={handleCreateSubPage}
              title="Add sub-page"
              style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-muted)',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              +
            </button>
            <button
              onClick={handleDelete}
              title="Move to trash"
              style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-muted)',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Drop indicator line: BELOW (only if no expanded children follow) */}
      {isDropBelow && (
        <div
          style={{
            height: '2px',
            background: 'var(--accent-primary)',
            borderRadius: '1px',
            marginLeft: `${indentPx}px`,
            marginRight: '8px',
            marginTop: '-1px',
            position: 'relative',
            zIndex: 20,
          }}
        />
      )}

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.page.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              dropIndicator={dropIndicator}
            />
          ))}
        </div>
      )}
    </>
  );
}
