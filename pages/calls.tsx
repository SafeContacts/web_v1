//File:: pages/calls.tsx
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
  Text,
  Flex,
  useColorModeValue,
  Card,
  CardBody,
  HStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  Button,
} from '@chakra-ui/react';
import { PhoneIcon, RepeatIcon } from '@chakra-ui/icons';
import CallLogCard, { CallLog } from '../components/CallLogCard';

export default function CallsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadCallLogs = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/calls/calllog', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to load call logs');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load call logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCallLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCallLogs();
  };

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Call History - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.500">Loading call history...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Head>
          <title>Call History - SafeContacts</title>
        </Head>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  const totalCalls = logs.length;
  const recentCalls = logs.filter((log) => {
    const date = new Date(log.timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  return (
    <Box>
      <Head>
        <title>Call History - SafeContacts</title>
      </Head>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            Call History
          </Heading>
          <Text color="gray.500">View and manage your call logs</Text>
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
      {logs.length > 0 && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardBody>
            <HStack spacing={6}>
              <Stat>
                <StatLabel>Total Calls</StatLabel>
                <StatNumber fontSize="2xl">{totalCalls}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>This Week</StatLabel>
                <StatNumber fontSize="2xl" color="brand.500">
                  {recentCalls}
                </StatNumber>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Call Logs */}
      {logs.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
          <CardBody textAlign="center" py={12}>
            <PhoneIcon boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" mb={2} color="gray.500">
              No Call History
            </Heading>
            <Text color="gray.500">Your call logs will appear here once you start making calls</Text>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {logs.map((log) => (
            <CallLogCard key={log._id} log={log} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
