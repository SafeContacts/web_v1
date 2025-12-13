import { Box, Heading, VStack, Spinner, Alert, AlertIcon, Text, Badge
} from '@chakra-ui/react';
import useContactsViewModel from '../viewmodels/ContactsViewModel';

export default function ContactsPage() {
  const { contacts, loading, error, refetch } = useContactsViewModel();

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
  if (!contacts || contacts.length === 0) {
    return (
      <Box p={6}>
        <Heading>No contacts found.</Heading>
        <Text mt={2}>Import or sync to see your contacts here.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>My Contacts</Heading>
      <VStack spacing={4} align="stretch">
        {contacts.map((c, idx) => (
          <Box
            key={idx}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
          >
            <Heading size="md">{c.name}</Heading>
            <Text>📞 {c.phone}</Text>
            {c.email && <Text>✉️ {c.email}</Text>}
            {c.company && <Text>🏢 {c.company}</Text>}
            {c.tags?.length && (
              <Box mt={2}>
                {c.tags.map(tag => (
                  <Badge key={tag} mr={1}>{tag}</Badge>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

