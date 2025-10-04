
/*** Add File: components/ContactCard.tsx */
import React from 'react';
import { Box, Text, Badge, HStack, VStack } from '@chakra-ui/react';
import CallButton from './CallButton';
import SmsButton from './SmsButton';
import { WhatsAppButton } from './WhatsAppButton';

export interface Contact {
  _id?: string;
  id?: string;
  name: string;
  phone?: string;
  phones?: { value: string }[];
  email?: string;
  emails?: { value: string }[];
  company?: string;
  confidenceScore?: number;
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
}

export interface ContactCardProps {
  contact: Contact;
  userId?: string;
}

export default function ContactCard({ contact, userId }: ContactCardProps) {
  const primaryPhone = contact.phone || contact.phones?.[0]?.value || '';
  const primaryEmail = contact.email || contact.emails?.[0]?.value || '';
  const score = contact.confidenceScore ?? 0;

  return (
    <Box p={4} borderWidth="1px" borderRadius="md" w="100%" _hover={{ shadow: 'md' }}>
      <Text fontWeight="bold" fontSize="lg">{contact.name}</Text>
      <VStack align="start" spacing={1} mb={2}>
        {primaryPhone && (
          <HStack spacing={2}>
            <Text fontSize="sm">{primaryPhone}</Text>
            <CallButton contactId={contact._id} phone={primaryPhone} userId={userId} />
            <SmsButton contactId={contact._id} phone={primaryPhone} userId={userId} />
            <WhatsAppButton phoneNumber={primaryPhone} enableCloudApi={!!process.env.NEXT_PUBLIC_WABA_ENABLED} />
          </HStack>
        )}
        {primaryEmail && <Text fontSize="sm">{primaryEmail}</Text>}
        {contact.company && <Text fontSize="sm">{contact.company}</Text>}
      </VStack>
      <Badge colorScheme={score > 50 ? 'green' : score > 20 ? 'yellow' : 'red'}>
        {score}%
      </Badge>
    </Box>
  );
}
