import { useState, useEffect, useRef, useCallback } from 'react';
import * as pagesApi from '../api/pages';
import type { SearchResult } from '../api/pages';
import { usePageStore } from '../stores/pageStore';

export function useSearch() {
  const workspace = usePageStore((s) => s.workspace);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!workspace || !q.trim()) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await pagesApi.searchPages(workspace.id, q.trim());
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [workspace]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, searched, reset };
}
