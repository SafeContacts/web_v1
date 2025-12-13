import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  VStack,
  Button,
  Input,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Text,
  Flex,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { RepeatIcon, UploadIcon, CloseIcon } from '@chakra-ui/icons';

type ContactItem = {
  phone: string;
  name: string;
  email?: string;
  company?: string;
  address?: string;
  jobTitle?: string;
  birthday?: string;
  tags?: string[];
};

export default function SyncPage() {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deltas, setDeltas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<{ inserted: number; updated: number; count: number } | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleFileUpload = async () => {
    if (!file && !text) {
      toast({
        status: 'warning',
        title: 'No data provided',
        description: 'Please upload a file or paste JSON data',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const raw = file ? await file.text() : text;
    let contacts: ContactItem[];
    try {
      contacts = JSON.parse(raw);
      if (!Array.isArray(contacts)) throw new Error('Not an array');
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Invalid JSON',
        description: err.message || 'Please provide valid JSON array',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contacts }),
      });

      if (res.ok) {
        const data = await res.json();
        setSyncStats(data);
        toast({
          status: 'success',
          title: 'Sync Complete!',
          description: `Inserted: ${data.inserted}, Updated: ${data.updated}`,
          duration: 5000,
          isClosable: true,
        });
        setFile(null);
        setText('');
      } else {
        const err = await res.json();
        setError(err.error || 'Sync failed');
        toast({
          status: 'error',
          title: 'Sync Failed',
          description: err.error || 'Failed to sync contacts',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
      toast({
        status: 'error',
        title: 'Error',
        description: err.message || 'An unexpected error occurred',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSync = async () => {
    setSyncing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      // For quick sync, we'd typically get contacts from device
      // For now, just refresh the contacts list
      toast({
        status: 'info',
        title: 'Quick Sync',
        description: 'This feature will sync with your device contacts',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Sync Failed',
        description: err.message || 'Failed to sync',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box>
      <Head>
        <title>Sync Contacts - SafeContacts</title>
      </Head>

      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            Sync Contacts
          </Heading>
          <Text color="gray.500">Import and sync your contacts from device or file</Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={handleQuickSync}
          isLoading={syncing}
          loadingText="Syncing..."
          size="md"
        >
          Quick Sync
        </Button>
      </Flex>

      {/* Sync Stats */}
      {syncStats && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardHeader>
            <Heading size="md">Last Sync Results</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={6}>
              <Stat>
                <StatLabel>Total Processed</StatLabel>
                <StatNumber fontSize="2xl">{syncStats.count}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Inserted</StatLabel>
                <StatNumber fontSize="2xl" color="green.500">
                  {syncStats.inserted}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Updated</StatLabel>
                <StatNumber fontSize="2xl" color="blue.500">
                  {syncStats.updated}
                </StatNumber>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Import Section */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
        <CardHeader>
          <Heading size="md">Import Contacts from File</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Upload a JSON file or paste JSON data to import contacts
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Upload JSON File
              </Text>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                size="lg"
              />
              {file && (
                <HStack mt={2}>
                  <Text fontSize="sm" color="gray.600">
                    Selected: {file.name}
                  </Text>
                  <IconButton
                    aria-label="Remove file"
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setFile(null)}
                  />
                </HStack>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Or Paste JSON Data
              </Text>
              <Textarea
                placeholder='[{"name": "John Doe", "phone": "+1234567890", "email": "john@example.com"}, ...]'
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                fontFamily="mono"
                fontSize="sm"
              />
            </Box>

            <Button
              leftIcon={<UploadIcon />}
              onClick={handleFileUpload}
              isLoading={loading}
              loadingText="Importing..."
              size="lg"
              w="100%"
            >
              Import & Sync Contacts
            </Button>

            {loading && (
              <Flex justify="center" py={4}>
                <Spinner size="xl" color="primary.500" />
              </Flex>
            )}

            {error && (
              <Alert status="error" borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {deltas.length > 0 && (
              <Box mt={4}>
                <Heading size="sm" mb={3}>
                  Detected Changes ({deltas.length})
                </Heading>
                <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                  {deltas.map((d, i) => (
                    <Box key={i} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" textTransform="uppercase" color="primary.600">
                            {d.type}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {d.phone}
                          </Text>
                          {d.field && (
                            <Text fontSize="xs" color="gray.500">
                              {d.field}: {d.oldValue} → {d.newValue}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Instructions */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mt={6}>
        <CardHeader>
          <Heading size="md">Format Guide</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" color="gray.600">
              Your JSON file should be an array of contact objects with the following structure:
            </Text>
            <Box
              as="pre"
              p={4}
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderRadius="lg"
              fontSize="xs"
              overflowX="auto"
            >
              {JSON.stringify(
                [
                  {
                    name: 'John Doe',
                    phone: '+1234567890',
                    email: 'john@example.com',
                    company: 'Acme Corp',
                    tags: ['work', 'friend'],
                  },
                ],
                null,
                2
              )}
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}
