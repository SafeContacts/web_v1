// =============================================
// File: pages/business.tsx — Business Search with Modern UI
// =============================================
import React, { useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Input,
  VStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  HStack,
  Badge,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, PhoneIcon, ChatIcon } from '@chakra-ui/icons';
import { buildWhatsAppChatUrl } from '../lib/deeplinks';
import { toE164 } from '../lib/phone';
import data from '../public/businesses.json';

const score = (q: string, name: string) => {
  q = q.toLowerCase();
  name = name.toLowerCase();
  if (name.includes(q)) return q.length / name.length + 0.5; // contain boost
  // Jaro-Winkler-lite: prefix match boost
  let prefix = 0;
  for (let i = 0; i < Math.min(q.length, name.length); i++) {
    if (q[i] === name[i]) prefix++;
    else break;
  }
  return prefix / q.length;
};

export default function BusinessSearchPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const results = React.useMemo(() => {
    if (!q.trim()) return [] as any[];
    setLoading(true);
    const items = (data as any[]).map((b) => ({ ...b, _s: score(q, b.name) }));
    const filtered = items.filter((b) => b._s > 0).sort((a, b) => b._s - a._s).slice(0, 10);
    setTimeout(() => setLoading(false), 300);
    return filtered;
  }, [q]);

  return (
    <Box>
      <Head>
        <title>Business Discovery - SafeContacts</title>
      </Head>

      {/* Header */}
      <Box mb={8}>
        <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
          Business Discovery
        </Heading>
        <Text color="gray.500">Find and connect with local businesses</Text>
      </Box>

      {/* Search */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardBody>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search businesses (e.g., 'Pizza Hut', 'pharmacy', 'restaurant')"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="lg"
            />
          </InputGroup>
        </CardBody>
      </Card>

      {/* Results */}
      {loading && (
        <Flex justify="center" py={8}>
          <Spinner size="xl" color="brand.500" />
        </Flex>
      )}

      {!loading && q.trim() && results.length === 0 && (
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

      {!loading && !q.trim() && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody textAlign="center" py={12}>
            <Text color="gray.500">Start typing to search for businesses</Text>
          </CardBody>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" color="gray.500">
            Found {results.length} business{results.length !== 1 ? 'es' : ''}
          </Text>
          {results.map((b) => {
            const e164 = toE164(b.phone);
            const waUrl = buildWhatsAppChatUrl(e164, `Hi ${b.name}, I'd like to inquire.`);
            return (
              <Card
                key={b.id}
                bg={cardBg}
                borderColor={borderColor}
                borderWidth="1px"
                _hover={{ bg: hoverBg, transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
              >
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Heading size="md">{b.name}</Heading>
                      <Badge colorScheme="brand" fontSize="sm">
                        {b.category}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      📍 {b.location}
                    </Text>
                    <HStack spacing={3}>
                      <Button
                        as="a"
                        href={`tel:${e164}`}
                        size="sm"
                        leftIcon={<PhoneIcon />}
                        colorScheme="green"
                      >
                        Call
                      </Button>
                      <Button
                        as="a"
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        leftIcon={<ChatIcon />}
                        colorScheme="whatsapp"
                        variant="outline"
                      >
                        WhatsApp
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
