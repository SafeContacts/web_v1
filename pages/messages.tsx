// pages/messages.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Heading, VStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import MessageLogCard, { MessageLog } from '../components/MessageLogCard';

export default function MessagesPage() {
  const [logs, setLogs]       = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    axios.get<MessageLog[]>('/api/messages')
      .then(res => setLogs(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load message logs.');
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
        <Heading>No message history.</Heading>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Message Log</Heading>
      <VStack spacing={4} align="stretch">
        {logs.map(log => <MessageLogCard key={log._id} log={log} />)}
      </VStack>
    </Box>
  );
}

