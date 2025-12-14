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
  Stat,
  StatLabel,
  StatNumber,
  Input,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { RepeatIcon, AddIcon } from '@chakra-ui/icons';

interface TrustEdge {
  _id: string;
  level: number;
  to: {
    _id: string;
    phones: Array<{ value: string; label?: string }>;
    emails: Array<{ value: string; label?: string }>;
    addresses: string[];
    socials: any;
  };
}

export default function TrustManagementPage() {
  const router = useRouter();
  const toast = useToast();
  const [edges, setEdges] = useState<TrustEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toPersonId, setToPersonId] = useState('');
  const [level, setLevel] = useState(1);
  const [adding, setAdding] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadTrustEdges = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/trust', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEdges(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to load trust relationships');
      }
    } catch (err: any) {
      console.error('Failed to fetch trust edges', err);
      setError('Failed to load trust relationships');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrustEdges();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTrustEdges();
  };

  const handleAddTrust = async () => {
    if (!toPersonId.trim()) {
      toast({
        status: 'warning',
        title: 'Validation Error',
        description: 'Please enter a person ID',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setAdding(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/trust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toPersonId, level }),
      });

      if (res.ok) {
        const data = await res.json();
        setEdges([...edges, data]);
        setToPersonId('');
        setLevel(1);
        toast({
          status: 'success',
          title: 'Trust Relationship Added',
          description: 'Trust relationship has been created successfully',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const err = await res.json();
        toast({
          status: 'error',
          title: 'Failed to Add Trust',
          description: err.message || 'Failed to create trust relationship',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Error',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Trust Management - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.500">Loading trust relationships...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Head>
          <title>Trust Management - SafeContacts</title>
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
        <title>Trust Management - SafeContacts</title>
      </Head>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            Trust Management
          </Heading>
          <Text color="gray.500">Manage your trust relationships with contacts</Text>
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
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardBody>
          <Stat>
            <StatLabel>Total Trust Relationships</StatLabel>
            <StatNumber fontSize="3xl">{edges.length}</StatNumber>
          </Stat>
        </CardBody>
      </Card>

      {/* Add Trust */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardBody>
          <Heading size="md" mb={4}>
            Add Trust Relationship
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Person ID</FormLabel>
              <Input
                value={toPersonId}
                onChange={(e) => setToPersonId(e.target.value)}
                placeholder="Enter person ID to trust"
                size="lg"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Trust Level (1-10)</FormLabel>
              <Select value={level} onChange={(e) => setLevel(parseInt(e.target.value))} size="lg">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                  <option key={l} value={l}>
                    Level {l}
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              leftIcon={<AddIcon />}
              onClick={handleAddTrust}
              isLoading={adding}
              loadingText="Adding..."
              colorScheme="brand"
              size="lg"
            >
              Add Trust Relationship
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Trust Edges List */}
      {edges.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
          <CardBody textAlign="center" py={12}>
            <Heading size="md" mb={2} color="gray.500">
              No Trust Relationships
            </Heading>
            <Text color="gray.500">Start building your trust network by adding trust relationships</Text>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {edges.map((edge) => (
            <Card key={edge._id} bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Heading size="sm">Person ID: {edge.to._id}</Heading>
                    <Badge colorScheme="green" fontSize="sm">
                      Level {edge.level}
                    </Badge>
                  </HStack>
                  {edge.to.phones && edge.to.phones.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Phones:
                      </Text>
                      {edge.to.phones.map((p, idx) => (
                        <Text key={idx} fontSize="sm">
                          {p.value} {p.label && `(${p.label})`}
                        </Text>
                      ))}
                    </Box>
                  )}
                  {edge.to.emails && edge.to.emails.length > 0 && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Emails:
                      </Text>
                      {edge.to.emails.map((e, idx) => (
                        <Text key={idx} fontSize="sm">
                          {e.value} {e.label && `(${e.label})`}
                        </Text>
                      ))}
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
}

