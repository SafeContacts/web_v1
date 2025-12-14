import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  VStack,
  Text,
  Card,
  CardBody,
  HStack,
  Badge,
  useColorModeValue,
  Spinner,
  Flex,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ArrowBackIcon } from '@chakra-ui/icons';

interface ConnectionRequest {
  id: string;
  status: string;
  message: string;
  isIncoming: boolean;
  fromPerson: { id: string; name: string };
  toPerson: { id: string; name: string };
  createdAt: string;
}

export default function ConnectionRequestsPage() {
  const router = useRouter();
  const toast = useToast();
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadRequests = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const [incomingRes, outgoingRes] = await Promise.all([
        fetch('/api/network/connect?type=incoming', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/network/connect?type=outgoing', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (incomingRes.ok) {
        const data = await incomingRes.json();
        setIncoming(data);
      }
      if (outgoingRes.ok) {
        const data = await outgoingRes.json();
        setOutgoing(data);
      }
    } catch (err) {
      console.error('Failed to load connection requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return;

      const res = await fetch('/api/network/connect', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });

      if (res.ok) {
        toast({
          status: 'success',
          title: 'Connection Approved',
          duration: 3000,
          isClosable: true,
        });
        loadRequests();
      }
    } catch (err) {
      toast({
        status: 'error',
        title: 'Failed to Approve',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return;

      const res = await fetch('/api/network/connect', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });

      if (res.ok) {
        toast({
          status: 'info',
          title: 'Connection Rejected',
          duration: 3000,
          isClosable: true,
        });
        loadRequests();
      }
    } catch (err) {
      toast({
        status: 'error',
        title: 'Failed to Reject',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Connection Requests - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Head>
        <title>Connection Requests - SafeContacts</title>
      </Head>

      <Box mb={8}>
        <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
          Connection Requests
        </Heading>
        <Text color="gray.500">Manage your incoming and outgoing connection requests</Text>
      </Box>

      <Tabs>
        <TabList>
          <Tab>
            Incoming ({incoming.length})
          </Tab>
          <Tab>
            Outgoing ({outgoing.length})
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {incoming.length === 0 ? (
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
                <CardBody textAlign="center" py={12}>
                  <Text color="gray.500">No incoming connection requests</Text>
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={4} align="stretch">
                {incoming.map((req) => (
                  <Card key={req.id} bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{req.fromPerson.name}</Text>
                          <Badge colorScheme="orange">Pending</Badge>
                        </HStack>
                        {req.message && (
                          <Text fontSize="sm" color="gray.600">
                            {req.message}
                          </Text>
                        )}
                        <Text fontSize="xs" color="gray.500">
                          {new Date(req.createdAt).toLocaleString()}
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<CheckIcon />}
                            onClick={() => handleApprove(req.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<CloseIcon />}
                            onClick={() => handleReject(req.id)}
                          >
                            Reject
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </TabPanel>

          <TabPanel>
            {outgoing.length === 0 ? (
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
                <CardBody textAlign="center" py={12}>
                  <Text color="gray.500">No outgoing connection requests</Text>
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={4} align="stretch">
                {outgoing.map((req) => (
                  <Card key={req.id} bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{req.toPerson.name}</Text>
                          <Badge
                            colorScheme={
                              req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'
                            }
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        </HStack>
                        {req.message && (
                          <Text fontSize="sm" color="gray.600">
                            {req.message}
                          </Text>
                        )}
                        <Text fontSize="xs" color="gray.500">
                          {new Date(req.createdAt).toLocaleString()}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

