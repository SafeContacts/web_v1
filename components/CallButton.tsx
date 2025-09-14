// components/CallButton.tsx
import React from 'react';
import axios from 'axios';
import { IconButton, useToast } from '@chakra-ui/react';
import { PhoneIcon } from '@chakra-ui/icons';

export default function CallButton({
  contactId,
  phone
}: {
  contactId?: string;
  phone: string;
}) {
  const toast = useToast();

  const handleClick = async () => {
    try {
      // log outgoing call
      await axios.post('/api/calls', { contactId, phone, outgoing: true });
    } catch (err) {
      console.error('Call log failed', err);
      toast({ status: 'error', title: 'Could not log call' });
    } finally {
      // initiate call
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <IconButton
      aria-label="Call"
      icon={<PhoneIcon />}
      onClick={handleClick}
    />
  );
}

