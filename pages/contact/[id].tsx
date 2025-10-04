/*** File: pages/contact/[id].tsx */

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '../../src/lib/api';
import ContactCard from '../../components/ContactCard';
import {
  Box,
  VStack,
  Button,
  Text,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

type EnrichmentSuggestion = {
  field: string;
  value: string;
  source: string;
};

export default function ContactDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [contact, setContact] = useState<any | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [enriching, setEnriching]     = useState(false);

  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // decode userId from token in localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.sub);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) return;

    setLoading(true);
    setError(null);

    api.get(`/api/contacts/${id}`)
      .then(res => setContact(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
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
      const res = await api.get<EnrichmentSuggestion[]>(`/api/contacts/${id}/enrich`);
      setSuggestions(res.data);
    } catch (err) {
      console.error('Enrichment fetch failed', err);
    }
  };

  const applyAll = async () => {
    if (!contact || !id || suggestions.length === 0) return;
    setEnriching(true);
    try {
      const updates = suggestions.reduce<Record<string, string>>((acc, s) => {
        acc[s.field] = s.value;
        return acc;
      }, {});
      const res = await api.patch(`/api/contacts/${id}`, updates);
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
      {/* Use ContactCard to display contact info with call and sms */}
      <ContactCard contact={contact} userId={userId} />

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
