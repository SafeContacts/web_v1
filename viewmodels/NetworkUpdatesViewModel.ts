// viewmodels/NetworkUpdatesViewModel.ts
import { useState, useEffect, useCallback } from 'react';
//import axios from 'axios';
import api from '../src/lib/api';


export interface NetworkUpdate {
  _id:         string;
  contactId:   string;
  field:       string;
  oldValue:    string;
  newValue:    string;
  createdAt:   string;
}

export default function useNetworkUpdatesViewModel() {
  const [updates, setUpdates] = useState<NetworkUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<NetworkUpdate[]>('/api/sync/network-updates');
      setUpdates(res.data);
    } catch (err: any) {
      console.error('Network updates fetch failed', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  return { updates, loading, error, refetch: fetchUpdates };
}

