import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Input,
  Button,
  VStack,
  Heading,
  Text,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Card,
  CardBody,
  Flex,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import NetworkSearchResultCard from '../components/NetworkSearchResult';

export default function Discovery() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const search = async () => {
    if (!query.trim()) {
      toast({
        status: 'warning',
        title: 'Empty Query',
        description: 'Please enter a search term',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/network/search?query=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.length === 0) {
          toast({
            status: 'info',
            title: 'No Results',
            description: 'No contacts found matching your search',
            duration: 3000,
            isClosable: true,
          });
        }
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const err = await res.json();
        toast({
          status: 'error',
          title: 'Search Failed',
          description: err.message || 'Failed to search contacts',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        status: 'error',
        title: 'Error',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  return (
    <Box>
      <Head>
        <title>Contact Discovery - SafeContacts</title>
      </Head>

      {/* Header */}
      <Box mb={8}>
        <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
          Contact Discovery
        </Heading>
        <Text color="gray.500">Search and discover contacts in your network</Text>
      </Box>

      {/* Search */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardBody>
          <VStack spacing={4}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by name, phone, email, or company..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                size="lg"
              />
            </InputGroup>
            <Button onClick={search} isLoading={loading} loadingText="Searching..." size="lg" w="100%">
              Search Network
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Results */}
      {loading && (
        <Flex justify="center" py={8}>
          <Spinner size="xl" color="brand.500" />
        </Flex>
      )}

      {!loading && results.length > 0 && (
        <Box>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Found {results.length} contact{results.length !== 1 ? 's' : ''} in your network
          </Text>
          <VStack spacing={4} align="stretch">
            {results.map((r) => (
              <NetworkSearchResultCard
                key={r._id || r.personId}
                result={r}
                onConnect={() => {
                  // Refresh results after connection
                  search();
                }}
                onApprove={() => {
                  // Refresh results after approval
                  search();
                }}
                onReject={() => {
                  // Refresh results after rejection
                  search();
                }}
              />
            ))}
          </VStack>
        </Box>
      )}

      {!loading && query && results.length === 0 && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
          <CardBody textAlign="center" py={12}>
            <SearchIcon boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" mb={2} color="gray.500">
              No Results Found
            </Heading>
            <Text color="gray.500">Try searching with different keywords</Text>
          </CardBody>
        </Card>
      )}
    </Box>
  );
}
