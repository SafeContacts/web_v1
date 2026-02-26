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
      //const res = await api.get<UserContact[]>('/api/contacts');
      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : data?.contacts ?? []);
    } catch (err: any) {
      console.error('Fetch contacts failed', err);
      setError((err as any)?.response?.data?.error || (err as Error)?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  return { contacts, loading, error, refetch: fetchContacts };
}

