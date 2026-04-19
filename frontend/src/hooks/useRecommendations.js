import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useRecommendations(userId, refreshKey) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshRecommendations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.getRecommendations(userId, 8);
      setRecommendations(data.recommendations || []);
      setError('');
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshRecommendations();
  }, [refreshKey, refreshRecommendations]);

  return { error, loading, recommendations, refreshRecommendations };
}
