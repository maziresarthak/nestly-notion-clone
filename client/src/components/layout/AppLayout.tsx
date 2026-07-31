import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import SearchDialog from '../search/SearchDialog';
import ErrorBoundary from '../ErrorBoundary';
import { usePageStore } from '../../stores/pageStore';
import * as workspacesApi from '../../api/workspaces';
import * as pagesApi from '../../api/pages';

/**
 * AppLayout: responsive two-panel layout.
 * - Desktop: fixed sidebar + main content.
 * - Mobile (<768px): hamburger drawer overlay.
 * Registers Cmd+K (search) and Cmd+N (new page) shortcuts.
 */
export default function AppLayout() {
  const navigate = useNavigate();
  const setWorkspace = usePageStore((s) => s.setWorkspace);
  const setPages = usePageStore((s) => s.setPages);
  const addPage = usePageStore((s) => s.addPage);
  const workspace = usePageStore((s) => s.workspace);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadWorkspaceAndPages();

    async function loadWorkspaceAndPages() {
      try {
        const workspaces = await workspacesApi.getWorkspaces();
        if (workspaces.length > 0) {
          const ws = workspaces[0];
          setWorkspace(ws);

          const pages = await pagesApi.getPages(ws.id);
          setPages(pages);
        }
      } catch (err) {
        console.error('Failed to load workspace/pages:', err);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Responsive: track window width
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard shortcuts: Cmd+K (search), Cmd+N (new page)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewPage();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // Re-bind every render so handleNewPage captures current workspace

  const handleNewPage = async () => {
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
      navigate(`/page/${newPage.id}`);
      toast.success('Page created');
    } catch {
      toast.error('Failed to create page');
    }
  };

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 60,
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 70,
          }}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: drawer overlay */}
      <div
        style={{
          ...(isMobile
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 80,
                transform: isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
              }
            : {}),
        }}
      >
        <Sidebar
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={isMobile ? () => setIsMobileSidebarOpen(false) : undefined}
        />
      </div>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
          ...(isMobile ? { paddingTop: '52px' } : {}),
        }}
      >
        {workspace ? (
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid var(--border-default)',
                borderTopColor: 'var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Loading Nestly…
            </span>
          </div>
        )}
      </main>

      <SearchDialog isOpen={isSearchOpen} onClose={handleCloseSearch} />
    </div>
  );
}
