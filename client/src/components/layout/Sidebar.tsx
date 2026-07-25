import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import { usePageStore } from '../../stores/pageStore';
import * as authApi from '../../api/auth';
import * as pagesApi from '../../api/pages';
import * as workspacesApi from '../../api/workspaces';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const workspace = usePageStore((s) => s.workspace);
  const pages = usePageStore((s) => s.pages);
  const activePageId = usePageStore((s) => s.activePageId);
  const setWorkspace = usePageStore((s) => s.setWorkspace);
  const addPage = usePageStore((s) => s.addPage);
  const removePage = usePageStore((s) => s.removePage);
  const setActivePageId = usePageStore((s) => s.setActivePageId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);

  // Sync workspace name
  useEffect(() => {
    if (workspace) setWorkspaceName(workspace.name);
  }, [workspace?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when editing
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

  // ─── Create page ───────────────────────────────────
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

  // ─── Delete page ───────────────────────────────────
  const handleDeletePage = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (!workspace) return;
    try {
      await pagesApi.deletePage(workspace.id, pageId);
      removePage(pageId);
      toast.success('Page moved to trash');
      // Navigate to another page or dashboard
      if (activePageId === pageId) {
        const remaining = pages.filter((p) => p.id !== pageId);
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

  // ─── Logout ────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  // ─── Navigate to page ──────────────────────────────
  const handlePageClick = (pageId: string) => {
    setActivePageId(pageId);
    navigate(`/page/${pageId}`);
  };

  // Determine active page from URL
  const urlPageId = location.pathname.startsWith('/page/')
    ? location.pathname.split('/page/')[1]
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

      {/* ─── Page List ────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '4px 10px',
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
          pages.map((page) => {
            const isActive = page.id === urlPageId;
            const isHovered = page.id === hoveredPageId;

            return (
              <div
                key={page.id}
                onClick={() => handlePageClick(page.id)}
                onMouseEnter={() => setHoveredPageId(page.id)}
                onMouseLeave={() => setHoveredPageId(null)}
                style={{
                  padding: '6px 10px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isActive
                    ? 'var(--accent-subtle)'
                    : isHovered
                    ? 'var(--bg-hover)'
                    : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                  marginBottom: '2px',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '14px', flexShrink: 0 }}>
                  {page.icon || '📄'}
                </span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {page.title || 'Untitled'}
                </span>

                {/* Delete button on hover */}
                {isHovered && (
                  <button
                    onClick={(e) => handleDeletePage(e, page.id)}
                    title="Move to trash"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      padding: '2px 4px',
                      borderRadius: 'var(--radius-sm)',
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })
        )}
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
