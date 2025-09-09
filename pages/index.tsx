import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Heading, Input, VStack } from '@chakra-ui/react';
import ContactCard from '../components/ContactCard';

export default function Dashboard() {
  const [contacts, setContacts] = useState<any[]>([]);
  useEffect(() => {
    setContacts([]);
  }, []);

  return (
    <Box p={6}>
      <Heading mb={4}>Contacts Dashboard</Heading>
      <Input placeholder="Search contacts" mb={4}/>
      <VStack spacing={4}>
        {contacts.map(c => <ContactCard key={c.id} contact={c} />)}
      </VStack>
    </Box>
  );
}
