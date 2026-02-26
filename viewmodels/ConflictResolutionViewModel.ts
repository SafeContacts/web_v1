import { useState, useEffect, useCallback } from 'react';
import api from '../src/lib/api';
import useSocket from './useSocket';
import jwt_decode from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken { sub: string; }

export interface Suggestion {
  eventId: string;
  newValue: string;
  ts:       string;
  source:   string;
  trust:    number;
}

export interface ConflictGroup {
  phone:       string;
  field:       string;
  suggestions: Suggestion[];
}

export default function useConflictResolutionViewModel() {
  const [groups, setGroups]   = useState<ConflictGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  // Decode userId from JWT
  //const token   = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGM4NWVmYWQ1ZThmYzkzOGJlOTYwOTciLCJyb2xlIjoidXNlciIsImlhdCI6MTc1ODA4ODQ3NiwiZXhwIjoxNzU4MjYxMjc2fQ.Iaa1ia2wwyKjN3LnjjIk2jJnU9XUIfBXcEWcyb8nHQE'
  //const decoded = token ? (jwt_decode(token) as DecodedToken) : null;
  
  const { sub: userId } = jwtDecode<{ sub: string }>(token);

  //const userId  = decoded?.sub || '';

  const socket = useSocket(userId);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ConflictGroup[]>('/api/sync/network-updates');
      setGroups(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!socket) return;
    socket.on('sync:import',   fetchGroups);
    socket.on('sync:resolved', fetchGroups);
    socket.on('network:update', fetchGroups);
    return () => {
      socket.off('sync:import',   fetchGroups);
      socket.off('sync:resolved', fetchGroups);
      socket.off('network:update', fetchGroups);
    };
  }, [socket, fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}

