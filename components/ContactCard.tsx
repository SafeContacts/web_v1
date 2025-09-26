// components/ContactCard.tsx

import React from 'react';
import { Box, Text, Badge } from '@chakra-ui/react';
import CallButton from './CallButton';
import SmsButton  from './SmsButton';
import { WhatsAppButton } from "./WhatsAppButton";


export interface Contact {
  _id?: string;            // for MongoDB _id
  id?: string;             // for IndexedDB or stub data
  name: string;
  phone: string;
  confidenceScore: number;
  email?: string;
}


export interface ContactCardProps {
  contact: Contact;
  /** The current user's id. Used to log outgoing calls when clicking on
   * the phone number. Optional; if omitted, calls will not be logged. */
  userId?: string;
}

const Contact_Card: React.FC<{ contact: Contact }> = ({ contact }) => {
	const primaryPhone = contact?.phones?.[0] ?? "";
  return (
    <Box p={4}
      borderWidth="1px" borderRadius="md" w="100%" _hover={{ shadow: 'md' }} >
      <Text fontWeight="bold" fontSize="lg">{contact.name}</Text>
      <Text fontSize="sm" mb={2}>{contact.phone}
      <CallButton contactId={contact._id} phone={contact.phone} /></Text>
      <SmsButton  contactId={contact._id} phone={contact.phone} />
      <WhatsAppButton phoneNumber={primaryPhone} enableCloudApi={!!process.env.NEXT_PUBLIC_WABA_ENABLED} />

      <Badge colorScheme={contact.confidenceScore > 50 ? 'green' : 'yellow'}>
      	{contact.confidenceScore}%
      </Badge>

    </Box>
  );
};

//export default ContactCard;
export default function ContactCard({ contact, userId }: ContactCardProps) {
   const primaryPhone = contact.phones?.[0]?.value;
   const primaryEmail = contact.emails?.[0]?.value;

  // Log an outgoing call when the phone number is clicked. If no userId is
  // provided, logging is skipped. We include the contact's id if present so
  // that call logs can be associated with the contact.
  async function handleCallClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Prevent default navigation until we log the call
    e.preventDefault();
    if (!primaryPhone) return;
    if (userId) {
      try {
        await fetch('/api/calllog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            contactId: contact._id,
            phoneNumber: primaryPhone.replace(/\D/g, ''),
            type: 'outgoing',
          }),
        });
      } catch (err) {
        console.error('Failed to log call', err);
      }
    }
    // Initiate the call after logging
    window.location.href = `tel:${primaryPhone}`;
  }
   {primaryPhone && (
         <span>
           📞{' '}
            <a
              href={primaryPhone ? `tel:${primaryPhone}` : '#'}
              onClick={handleCallClick}
            >
              {primaryPhone}
            </a>
            {' '}|
         </span>
       )}
}
