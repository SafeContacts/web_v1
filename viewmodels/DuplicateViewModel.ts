// viewmodels/DuplicateViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../src/lib/api';

export default function useDuplicateViewModel() {
  const [groups, setGroups]     = useState<string[][]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<string[][]>('/api/duplicates');
      setGroups(res.data);
    } catch (err: any) {
      console.error('Failed to fetch duplicates', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}

