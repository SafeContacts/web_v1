import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Spinner } from '@chakra-ui/react';

export default function TrustButton({
  currentUserId,
  contactId
}: { currentUserId: string; contactId: string }) {
  const [mutual, setMutual] = useState<number|null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMutual = async () => {
    const res = await axios.get<{ mutualCount: number }>('/api/trust/mutual', {
      params: { userA: currentUserId, userB: contactId }
    });
    setMutual(res.data.mutualCount);
  };

  useEffect(() => { fetchMutual(); }, []);

  const sendRequest = async () => {
    setLoading(true);
    await axios.post('/api/trust/send', { fromUser: currentUserId, toUser: contactId });
    await fetchMutual();
    setLoading(false);
  };

  if (mutual === null) return <Spinner size="sm" />;

  return (
    <Button onClick={sendRequest} isLoading={loading}>
      {mutual > 0 ? `Mutuals: ${mutual}` : 'Connect (Trust)'}
    </Button>
  );
}

