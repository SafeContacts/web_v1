// components/SmsButton.tsx

import React from 'react';
import { IconButton, useToast } from '@chakra-ui/react';
import { ChatIcon } from '@chakra-ui/icons';
import api from '../src/lib/api';

interface SmsButtonProps {
  contactId?: string;
  phone: string;
  userId?: string;
}

export default function SmsButton({ contactId, phone, userId }: SmsButtonProps) {
  const toast = useToast();

  const handleClick = async () => {
    const normalized = phone.replace(/\D/g, '');
    try {
      // log outgoing SMS
      await api.post('/api/messages', {
        contactId,
        phoneNumber: normalized,
        userId,
        message: ''
      });
    } catch (err) {
      console.error('SMS log failed', err);
      toast({ status: 'error', title: 'Could not log SMS' });
    } finally {
      // open SMS app
      window.location.href = `sms:${normalized}`;
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
