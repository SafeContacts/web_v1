// pages/updates.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Text,
  Flex,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  HStack,
  Button,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import UpdateEventCard, { UpdateEvent } from '../components/UpdateEventCard';

export default function UpdatesPage() {
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<UpdateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');

  const loadUpdates = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/updates', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to load updates');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load updates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUpdates();
  };

  const applyEvent = async (evt: UpdateEvent) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      // 1) Patch the contact
      const patchRes = await fetch(`/api/contacts/${evt.contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [evt.field]: evt.newValue,
        }),
      });

      if (!patchRes.ok) {
        throw new Error('Failed to update contact');
      }

      // 2) Mark the update event as applied (stealth: false)
      await fetch(`/api/contacts/${evt.contactId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          field: evt.field,
          oldValue: evt.oldValue,
          newValue: evt.newValue,
          stealth: false,
        }),
      });

      // 3) Remove it from UI
      setEvents((evts) => evts.filter((e) => e.id !== evt.id));
      toast({
        status: 'success',
        title: 'Update Applied',
        description: `${evt.field} has been updated for ${evt.contactName}`,
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('applyEvent error:', err);
      toast({
        status: 'error',
        title: 'Failed to apply update',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const ignoreEvent = async (evt: UpdateEvent) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      // Mark as non-stealth so it won't reappear
      await fetch(`/api/contacts/${evt.contactId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          field: evt.field,
          oldValue: evt.oldValue,
          newValue: evt.newValue,
          stealth: false,
        }),
      });

      setEvents((evts) => evts.filter((e) => e.id !== evt.id));
      toast({
        status: 'info',
        title: 'Update Ignored',
        description: 'This update will not be shown again',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Failed to ignore update',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Suggested Updates - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.500">Loading updates...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Head>
          <title>Suggested Updates - SafeContacts</title>
        </Head>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Head>
        <title>Suggested Updates - SafeContacts</title>
      </Head>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            Suggested Updates
          </Heading>
          <Text color="gray.500">Review and apply contact information updates</Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={handleRefresh}
          isLoading={refreshing}
          loadingText="Refreshing"
          size="md"
        >
          Refresh
        </Button>
      </Flex>

      {/* Stats */}
      {events.length > 0 && (
        <Box mb={6} p={4} bg={cardBg} borderRadius="lg" borderWidth="1px">
          <Stat>
            <StatLabel>Pending Updates</StatLabel>
            <StatNumber fontSize="3xl">{events.length}</StatNumber>
          </Stat>
        </Box>
      )}

      {/* Updates List */}
      {events.length === 0 ? (
        <Box
          p={12}
          textAlign="center"
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderStyle="dashed"
        >
          <Heading size="md" mb={2} color="gray.500">
            No Pending Updates
          </Heading>
          <Text color="gray.500">All your contacts are up to date!</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {events.map((evt) => (
            <UpdateEventCard key={evt.id} event={evt} onApply={applyEvent} onIgnore={ignoreEvent} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
