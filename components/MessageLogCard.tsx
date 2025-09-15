// components/MessageLogCard.tsx
import { Box, Text, HStack } from '@chakra-ui/react';
import React from 'react';

export interface MessageLog {
  _id:       string;
  contactId?: string;
  phone:     string;
  outgoing:  boolean;
  message:   string;
  timestamp: string;
}

const MessageLogCard: React.FC<{ log: MessageLog }> = ({ log }) => (
  <Box p={3} borderWidth="1px" borderRadius="md" w="100%" bg="gray.50">
    <HStack justify="space-between">
      <Text>
        {log.outgoing ? '➡️' : '⬅️'} {log.phone}
      </Text>
      <Text fontSize="sm" color="gray.500">
        {new Date(log.timestamp).toLocaleString()}
      </Text>
    </HStack>
    {log.message && <Text mt={1} fontStyle="italic">{log.message}</Text>}
  </Box>
);

export default MessageLogCard;

