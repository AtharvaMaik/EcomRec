import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useUserHistory(userId) {
  const [history, setHistory] = useState({ purchases: [], views: [], orders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshHistory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.getHistory(userId);
      setHistory(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return { error, history, loading, refreshHistory };
}
