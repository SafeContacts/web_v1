import React from 'react';
import {
  Box,
  Heading,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  HStack,
  Badge,
  Button,
  useToast
} from '@chakra-ui/react';
import api from '../../src/lib/api';
import useConflictResolutionViewModel from '../../viewmodels/ConflictResolutionViewModel';

export default function ResolveGroupedPage() {
  const { groups, loading, error, refetch } = useConflictResolutionViewModel();
  const toast = useToast();

  const applySuggestion = async (phone: string, field: string, s: any) => {
    try {
      // 1) Lookup contact ID by phone
      const cRes = await api.get<Array<{ _id: string }>>(
        `/api/contacts?phone=${encodeURIComponent(phone)}`
      );
      if (!cRes.data.length) throw new Error('Contact not found');
      const contactId = cRes.data[0]._id;

      // 2) Apply the update
      await api.patch(`/api/contacts/${contactId}`, { [field]: s.newValue });

      // 3) Log the applied update
      await api.post(`/api/contacts/${contactId}/update`, {
        field,
        oldValue: '',
        newValue: s.newValue,
        stealth: false
      });

      toast({ status: 'success', title: 'Applied update' });
      refetch();
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Failed to apply',
        description: err.response?.data?.error || err.message
      });
    }
  };

  if (loading) return <Box p={6} textAlign="center"><Spinner size="xl" /></Box>;
  if (error)   return <Box p={6}><Alert status="error"><AlertIcon />{error}</Alert></Box>;
  if (!groups.length) {
    return <Box p={6}><Heading>No network conflicts.</Heading></Box>;
  }

  return (
    <Box p={{ base: 4, md: 6 }} bg="background">
      <Heading mb={4}>Resolve Network Conflicts</Heading>
      <VStack spacing={6} align="stretch">
        {groups.map((g, idx) => (
          <Box
            key={idx}
            p={4}
            bg="surface"
            borderRadius="md"
            borderWidth="1px"
            borderColor="secondary.500"
          >
            <HStack mb={2}>
              <Text fontWeight="bold">Contact:</Text>
              <Badge colorScheme="secondary">{g.phone}</Badge>
              <Text fontWeight="bold">Field:</Text>
              <Badge colorScheme="secondary">{g.field}</Badge>
            </HStack>

            <VStack spacing={3} align="stretch">
              {g.suggestions.map((s) => (
                <HStack key={s.eventId} justify="space-between">
                  <Text fontSize="md">{s.newValue}</Text>
                  <HStack>
                    <Badge colorScheme="accent">Trust: {s.trust}</Badge>
                    <Button
                      size="sm"
                      variant="solid"
                      onClick={() => applySuggestion(g.phone, g.field, s)}
                    >
                      Apply
                    </Button>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

