// components/SmsButton.tsx
import React from 'react';
import axios from 'axios';
import { IconButton, useToast } from '@chakra-ui/react';
import { ChatIcon } from '@chakra-ui/icons';

export default function SmsButton({
  contactId,
  phone
}: {
  contactId?: string;
  phone: string;
}) {
  const toast = useToast();

  const handleClick = async () => {
    try {
      // log outgoing SMS
      await axios.post('/api/messages', { contactId, phone, outgoing: true, message: '' });
    } catch (err) {
      console.error('SMS log failed', err);
      toast({ status: 'error', title: 'Could not log SMS' });
    } finally {
      // open SMS app
      window.location.href = `sms:${phone}`;
    }
  };

  return (
    <IconButton
      aria-label="SMS"
      icon={<ChatIcon />}
      onClick={handleClick}
    />
  );
}

