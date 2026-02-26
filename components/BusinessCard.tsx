// components/BusinessCard.tsx
import { Box, Text, Button } from '@chakra-ui/react';
import React from 'react';
import CallButton from './CallButton';
import SmsButton  from './SmsButton';

export interface Business {
  businessId: string;
  name: string;
  rating: number;
  phone?: string;
}

const BusinessCard: React.FC<{ biz: Business }> = ({ biz }) => (
  <Box p={4} borderWidth="1px" borderRadius="md" w="100%" _hover={{ shadow: 'md' }}>
    <Text fontWeight="bold">{biz.name}</Text>
    <Text>Rating: {biz.rating}</Text>
    {biz.phone && (
      <>
        <CallButton contactId={biz.businessId} phone={biz.phone} />
        <SmsButton contactId={biz.businessId} phone={biz.phone} />
      </>
    )}
    <Button size="sm" mt={2} onClick={() => 
      fetch(`/api/business/${biz.businessId}/claim`, { method: 'POST' })
    }>Claim</Button>
  </Box>
);

export default BusinessCard;

