// pages/sync/resolve.tsx
import React from 'react';
import {
  Box, Heading, VStack, Spinner, Alert, AlertIcon,
  Text, Button, useToast
} from '@chakra-ui/react';
import useSyncDeltasViewModel from '../../viewmodels/SyncDeltasViewModel';
import api from '../../src/lib/api';

export default function ResolvePage() {
  const { deltas, loading, error, refetch } = useSyncDeltasViewModel();
  const toast = useToast();

  const handleResolve = async (id: string) => {
    try {
      await api.post('/api/sync/resolve', { deltaIds: [id] });
      toast({ status: 'success', title: 'Resolved' });
      refetch();
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Resolve failed',
        description: err.response?.data?.error || err.message
      });
    }
  };

  if (loading) return <Spinner size="xl" />;
  if (error)   return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (deltas.length === 0) {
    return <Box p={6}><Heading>No pending changes to resolve.</Heading></Box>;
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Resolve Contact Changes</Heading>
      <VStack spacing={4} align="stretch">
        {deltas.map(d => (
          <Box key={d._id} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Text>
              <strong>{d.type.toUpperCase()}</strong> {d.phone} — {d.field || 'record'}:
              from “{d.oldValue}” to “{d.newValue}”
            </Text>
            <Button
              mt={2}
              size="sm"
              colorScheme="green"
              onClick={() => handleResolve(d._id)}
            >
              Resolve
            </Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
