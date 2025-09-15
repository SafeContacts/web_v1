// components/ContactCard.tsx

import React from 'react';
import { Box, Text, Badge } from '@chakra-ui/react';
import CallButton from './CallButton';
import SmsButton  from './SmsButton';


export interface Contact {
  _id?: string;            // for MongoDB _id
  id?: string;             // for IndexedDB or stub data
  name: string;
  phone: string;
  confidenceScore: number;
  email?: string;
}

const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => {
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      w="100%"
      _hover={{ shadow: 'md' }}
    >
      <Text fontWeight="bold" fontSize="lg">{contact.name}</Text>
      <Text fontSize="sm" mb={2}>{contact.phone}
      <CallButton contactId={contact._id} phone={contact.phone} /></Text>
      <SmsButton  contactId={contact._id} phone={contact.phone} />

      <Badge colorScheme={contact.confidenceScore > 50 ? 'green' : 'yellow'}>
      	{contact.confidenceScore}%
      </Badge>

    </Box>
  );
};

export default ContactCard;
