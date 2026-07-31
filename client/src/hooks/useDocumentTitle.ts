import { useEffect } from 'react';

/**
 * Sets document.title for the page. Restores 'Nestly' on unmount.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — Nestly` : 'Nestly';
    return () => {
      document.title = prev;
    };
  }, [title]);
}
