// pages/network-updates.tsx
import { useToast } from '@chakra-ui/react';
import {
  Box,
  Heading,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Button
} from '@chakra-ui/react';
import axios from 'axios';
import useNetworkUpdatesViewModel, { NetworkUpdate } from '../viewmodels/NetworkUpdatesViewModel';

export default function NetworkUpdatesPage() {
  const { updates, loading, error, refetch } = useNetworkUpdatesViewModel();
  const toast = useToast();

  const applyNetworkUpdate = async (evt: NetworkUpdate) => {
    try {
      // 1) Patch the Contact
      await axios.patch(`/api/contacts/${evt.contactId}`, {
        [evt.field]: evt.newValue
      });
      // 2) Record a non-stealth re-update to mark complete
      await axios.post(`/api/contacts/${evt.contactId}/update`, {
        field:    evt.field,
        oldValue: evt.oldValue,
        newValue: evt.newValue,
        stealth:  false
      });
      toast({ status: 'success', title: 'Applied network update' });
      // 3) Remove from UI
      refetch();
    } catch (err: any) {
      console.error('applyNetworkUpdate failed', err);
      toast({
        status: 'error',
        title: 'Failed to apply',
        description: err.response?.data?.error || err.message
      });
    }
  };

  if (loading) return <Box p={6} textAlign="center"><Spinner size="xl"/></Box>;
  if (error)   return <Box p={6}><Alert status="error"><AlertIcon />{error}</Alert></Box>;
  if (updates.length === 0) {
    return <Box p={6}><Heading>No new network updates.</Heading></Box>;
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Network Suggestions</Heading>
      <VStack spacing={4} align="stretch">
        {updates.map((u: NetworkUpdate) => (
          <Box key={u._id} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Text>
              <strong>{u.field}</strong> changed from <em>{u.oldValue}</em> to <em>{u.newValue}</em>
            </Text>
            <Text fontSize="sm" color="gray.500">
              On {new Date(u.createdAt).toLocaleString()}
            </Text>
            <Button
              mt={2}
              size="sm"
              colorScheme="blue"
              onClick={() => applyNetworkUpdate(u)}
            >
              Apply
            </Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

