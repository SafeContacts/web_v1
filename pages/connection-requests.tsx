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
  Divider,
  Icon,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ArrowBackIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';

interface ConnectionRequest {
  id: string;
  status: string;
  message: string;
  isIncoming: boolean;
  requestCount?: number;
  fromPerson: {
    id: string;
    name: string;
    phones?: Array<{ label: string; value: string; e164?: string }>;
    emails?: Array<{ label: string; value: string }>;
  };
  toPerson: { id: string; name: string };
  connectionPath?: {
    level: number;
    viaPersonName?: string;
    description: string;
  } | null;
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
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" fontSize="lg">
                              {req.fromPerson.name}
                            </Text>
                            {req.connectionPath && (
                              <Badge colorScheme={req.connectionPath.level === 1 ? 'green' : 'blue'} fontSize="xs">
                                {req.connectionPath.description}
                              </Badge>
                            )}
                          </VStack>
                          <Badge colorScheme="orange">Pending</Badge>
                        </HStack>

                        {/* Connection Path Info */}
                        {req.connectionPath && req.connectionPath.level > 1 && req.connectionPath.viaPersonName && (
                          <Box
                            bg={useColorModeValue('blue.50', 'blue.900')}
                            p={2}
                            borderRadius="md"
                            fontSize="sm"
                          >
                            <Text color="blue.600" fontWeight="medium">
                              Connected via: {req.connectionPath.viaPersonName}
                            </Text>
                          </Box>
                        )}

                        {/* Sender Contact Information */}
                        {(req.fromPerson.phones || req.fromPerson.emails) && (
                          <Box>
                            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="medium">
                              Contact Information:
                            </Text>
                            <VStack align="stretch" spacing={1}>
                              {req.fromPerson.phones?.map((phone, idx) => (
                                <HStack key={idx} spacing={2}>
                                  <Icon as={PhoneIcon} color="gray.500" boxSize={3} />
                                  <Text fontSize="sm">{phone.value}</Text>
                                </HStack>
                              ))}
                              {req.fromPerson.emails?.map((email, idx) => (
                                <HStack key={idx} spacing={2}>
                                  <Icon as={EmailIcon} color="gray.500" boxSize={3} />
                                  <Text fontSize="sm">{email.value}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        {req.message && (
                          <>
                            <Divider />
                            <Text fontSize="sm" color="gray.600" fontStyle="italic">
                              "{req.message}"
                            </Text>
                          </>
                        )}

                        <Divider />

                        <HStack justify="space-between">
                          <Text fontSize="xs" color="gray.500">
                            {new Date(req.createdAt).toLocaleString()}
                          </Text>
                          {req.requestCount && req.requestCount > 1 && (
                            <Badge colorScheme="gray" fontSize="xs">
                              Request #{req.requestCount}
                            </Badge>
                          )}
                        </HStack>

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

