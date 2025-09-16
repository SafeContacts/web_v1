import { useState, useEffect, useCallback } from 'react';
import api from '../src/lib/api';

export interface UserContact {
  phone: string;
  name:  string;
  email?: string;
  company?: string;
  address?: string;
  jobTitle?: string;
  birthday?: string;
  tags?: string[];
}

export default function useContactsViewModel() {
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string|null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<UserContact[]>('/api/contacts');
      setContacts(res.data);
    } catch (err: any) {
      console.error('Fetch contacts failed', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  return { contacts, loading, error, refetch: fetchContacts };
}

