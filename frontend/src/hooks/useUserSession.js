import { useEffect, useState } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'recommendit:userId';

export function useUserSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const storedUserId = localStorage.getItem(STORAGE_KEY);
        const data = await api.createSession(storedUserId);
        localStorage.setItem(STORAGE_KEY, data.user.id);
        if (!cancelled) {
          setUser(data.user);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return { error, loading, user };
}
