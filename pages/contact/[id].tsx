
// pages/contact/[id].tsx

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import TrustButton from '../../components/TrustButton';

import axios from 'axios';
import {
  Box,
  Heading,
  Text,
  Badge,
  VStack,
  Button,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

type Contact = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  confidenceScore: number;
};

type EnrichmentSuggestion = {
  field: string;
  value: string;
  source: string;
};

export default function ContactDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [enriching, setEnriching]     = useState(false);

  // Fetch contact on mount / id change
  useEffect(() => {
    if (!router.isReady || !id) return;

    setLoading(true);
    setError(null);

    axios.get<Contact>(`/api/contacts/${id}`)
      .then(res => setContact(res.data))
      .catch(err => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Contact not found.');
        } else {
          setError('Failed to load contact.');
        }
      })
      .finally(() => setLoading(false));
  }, [router.isReady, id]);

  const fetchEnrichment = async () => {
    if (!id) return;
    try {
      const res = await axios.get<EnrichmentSuggestion[]>(`/api/contacts/${id}/enrich`);
      setSuggestions(res.data);
    } catch (err) {
      console.error('Enrichment fetch failed', err);
    }
  };

  const applyAll = async () => {
    if (!contact || !id || suggestions.length === 0) return;
    setEnriching(true);
    try {
      // Build update payload
      const updates = suggestions.reduce<Record<string, string>>((acc, s) => {
        acc[s.field] = s.value;
        return acc;
      }, {});
      const res = await axios.patch<Contact>(`/api/contacts/${id}`, updates);
      setContact(res.data);
      setSuggestions([]);
    } catch (err) {
      console.error('Apply enrichment failed', err);
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box p={6}>
        <Text>No contact data available.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Contact Info */}
      <Heading mb={2}>{contact.name}</Heading>
      <Text mb={1}>{contact.phone}</Text>
      {contact.email && <Text mb={1}>Email: {contact.email}</Text>}
      {contact.company && <Text mb={1}>Company: {contact.company}</Text>}
      <Badge colorScheme="green">Score: {contact.confidenceScore}</Badge>
      {/* Trust / Connect */}
      <TrustButton
	currentUserId="USER_ABC"     // replace with actual logged-in user
	contactId={contact._id}
      />

      {/* Enrichment Section */}
      <VStack align="start" spacing={4} mt={6}>
        <Button onClick={fetchEnrichment}>Fetch Enrichment Suggestions</Button>

        {suggestions.map((s, idx) => (
          <Box key={idx} p={3} borderWidth="1px" borderRadius="md" w="100%">
            <Text><strong>{s.field}</strong> → {s.value}</Text>
            <Text fontSize="sm" color="gray.500">Source: {s.source}</Text>
          </Box>
        ))}

        {suggestions.length > 0 && (
          <Button
            colorScheme="blue"
            isLoading={enriching}
            onClick={applyAll}
          >
            Apply All Suggestions
          </Button>
        )}
      </VStack>
    </Box>
  );
}

