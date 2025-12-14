import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Flex,
  useColorModeValue,
  Card,
  CardBody,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import Layout from '../components/Layout';
import Dialer from '../components/Dialer';
import { Contact } from '../components/ContactCard';

export default function DialerPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    async function fetchData() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          router.push('/login');
          return;
        }

        // Get user ID from token or API
        // For now, we'll fetch contacts and use the first contact's userId
        const res = await fetch('/api/contacts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setContacts(data);
          // Extract userId from contacts if available
          if (data.length > 0 && data[0].userId) {
            setUserId(data[0].userId);
          } else {
            // Fallback: try to get from token payload (would need JWT decode)
            setUserId('current-user');
          }
        } else if (res.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load contacts');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while loading contacts');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Dialer - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.500">Loading dialer...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Head>
          <title>Dialer - SafeContacts</title>
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
        <title>Dialer - SafeContacts</title>
      </Head>

      <Box mb={8}>
        <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
          Dialer
        </Heading>
        <Text color="gray.500">Make calls and manage your contact interactions</Text>
      </Box>

      <Card bg={cardBg} borderWidth="1px">
        <CardBody>
          {userId ? (
            <Dialer contacts={contacts} userId={userId} />
          ) : (
            <Text color="gray.500">Loading dialer...</Text>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}
