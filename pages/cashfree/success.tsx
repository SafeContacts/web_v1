// pages/cashfree/success.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Heading, Spinner, Alert, AlertIcon, Button
} from '@chakra-ui/react';

export default function CashfreeSuccess() {
  const router = useRouter();
  const { link_id } = router.query as { link_id?: string };

  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState<string|null>(null);

  useEffect(() => {
    if (!link_id) return;
    axios.get<{ link_status: string }>('/api/cashfree/check-link', { params: { link_id } })
      .then(res => {
        setStatus(res.data.link_status);
        if (res.data.link_status === 'PAID') {
          localStorage.setItem('subscribed','true');
          router.replace('/');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [link_id]);

  if (loading) return <Box p={6}><Spinner size="xl" /></Box>;
  if (status !== 'PAID') {
    return (
      <Box p={6}>
        <Alert status="error"><AlertIcon />Payment {status}</Alert>
        <Button mt={4} onClick={()=>router.push('/subscribe')}>Try Again</Button>
      </Box>
    );
  }
  return (
    <Box p={6} textAlign="center">
      <Heading>Subscription Successful!</Heading>
      <Button mt={4} onClick={()=>router.push('/')}>Go Home</Button>
    </Box>
  );
}

