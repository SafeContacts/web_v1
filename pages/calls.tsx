// pages/calls.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  VStack,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import CallLogCard, { CallLog } from '../components/CallLogCard';

export default function CallsPage() {
  const [logs, setLogs]       = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    axios.get<CallLog[]>('/api/calls')
      .then(res => setLogs(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load call logs.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />{error}
        </Alert>
      </Box>
    );
  }
  if (logs.length === 0) {
    return (
      <Box p={6}>
        <Heading>No call history.</Heading>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Call Log</Heading>
      <VStack spacing={4} align="stretch">
        {logs.map(log => <CallLogCard key={log._id} log={log} />)}
      </VStack>
    </Box>
  );
}

