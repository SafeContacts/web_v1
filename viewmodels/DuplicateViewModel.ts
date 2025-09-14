// viewmodels/DuplicateViewModel.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useDuplicateViewModel() {
  const [groups, setGroups] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<string[][]>('/api/duplicates')
      .then((res) => {
        setGroups(res.data);
      })
      .catch((err) => {
        console.error('Failed to load duplicates:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { groups, loading };
}

