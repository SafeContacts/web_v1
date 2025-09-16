// viewmodels/SyncDeltasViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../src/lib/api';

export interface SyncDelta {
  _id: string;
  phone: string;
  field: string;
  oldValue: string;
  newValue: string;
  type: 'new' | 'update' | 'delete';
}

export default function useSyncDeltasViewModel() {
  const [deltas, setDeltas]   = useState<SyncDelta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  const fetchDeltas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SyncDelta[]>('/api/sync/deltas');
      setDeltas(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeltas(); }, [fetchDeltas]);

  return { deltas, loading, error, refetch: fetchDeltas };
}

