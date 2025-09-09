import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Heading, Text, Badge } from '@chakra-ui/react';

export default function ContactDetail() {
  const { query } = useRouter();
  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    if (query.id) {
      axios.get(`/api/contacts/discovery?query=${query.id}`).then(res => setContact(res.data[0]));
    }
  }, [query.id]);

  if (!contact) return <Box p={6}>Loading…</Box>;

  return (
    <Box p={6}>
      <Heading>{contact.name}</Heading>
      <Text mb={2}>{contact.phone}</Text>
      <Badge colorScheme="green">Score: {contact.confidenceScore}</Badge>
    </Box>
  );
}
