import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export function useProducts(filters) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const filtersKey = JSON.stringify(filters);
  const previousFiltersKey = useRef(filtersKey);

  useEffect(() => {
    if (previousFiltersKey.current !== filtersKey) {
      previousFiltersKey.current = filtersKey;
      setProducts([]);
      setPage(1);
      setHasMore(true);
    }
  }, [filtersKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts({ page, limit: 20, ...filters });
        if (cancelled) return;
        setProducts(prev => {
          const seen = new Set(prev.map(product => product.id));
          const next = data.products.filter(product => !seen.has(product.id));
          return page === 1 ? data.products : [...prev, ...next];
        });
        setHasMore(data.page < data.totalPages);
        setError('');
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage(prev => prev + 1);
  }, [hasMore, loading]);

  return { error, hasMore, loadMore, loading, products };
}
