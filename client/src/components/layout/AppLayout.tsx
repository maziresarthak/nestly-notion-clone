import { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchDialog from '../search/SearchDialog';
import { usePageStore } from '../../stores/pageStore';
import * as workspacesApi from '../../api/workspaces';
import * as pagesApi from '../../api/pages';

/**
 * AppLayout: two-panel layout — fixed sidebar + flexible main content.
 * Loads workspace + pages on mount. Registers Cmd+K search shortcut.
 */
export default function AppLayout() {
  const setWorkspace = usePageStore((s) => s.setWorkspace);
  const setPages = usePageStore((s) => s.setPages);
  const workspace = usePageStore((s) => s.workspace);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'auto',
        }}
      >
        {workspace ? (
          <Outlet />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
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
          </div>
        )}
      </main>

      <SearchDialog isOpen={isSearchOpen} onClose={handleCloseSearch} />
    </div>
  );
}
