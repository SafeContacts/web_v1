// pages/messages.tsx
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
  Stat,
  StatLabel,
  StatNumber,
  Button,
} from '@chakra-ui/react';
import { ChatIcon, RepeatIcon } from '@chakra-ui/icons';
import MessageLogCard, { MessageLog } from '../components/MessageLogCard';

export default function MessagesPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadMessageLogs = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/messages', {
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
        setError(err.message || 'Failed to load message logs');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load message logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessageLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessageLogs();
  };

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Message History - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.500">Loading message history...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Head>
          <title>Message History - SafeContacts</title>
        </Head>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  const totalMessages = logs.length;
  const recentMessages = logs.filter((log) => {
    const date = new Date(log.timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  return (
    <Box>
      <Head>
        <title>Message History - SafeContacts</title>
      </Head>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            Message History
          </Heading>
          <Text color="gray.500">View and manage your message logs</Text>
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
                <StatLabel>Total Messages</StatLabel>
                <StatNumber fontSize="2xl">{totalMessages}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>This Week</StatLabel>
                <StatNumber fontSize="2xl" color="brand.500">
                  {recentMessages}
                </StatNumber>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Message Logs */}
      {logs.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
          <CardBody textAlign="center" py={12}>
            <ChatIcon boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" mb={2} color="gray.500">
              No Message History
            </Heading>
            <Text color="gray.500">Your message logs will appear here once you start sending messages</Text>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {logs.map((log) => (
            <MessageLogCard key={log._id} log={log} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
