// components/CallLogCard.tsx
import { Box, Text, HStack } from '@chakra-ui/react';
import React from 'react';

export interface CallLog {
  _id:      string;
  contactId?: string;
  phone:    string;
  outgoing: boolean;
  timestamp: string;
}

const CallLogCard: React.FC<{ log: CallLog }> = ({ log }) => (
  <Box p={3} borderWidth="1px" borderRadius="md" w="100%" bg="gray.50">
    <HStack justify="space-between">
      <Text>
        {log.outgoing ? '↗' : '↙'} {log.phone}
      </Text>
      <Text fontSize="sm" color="gray.500">
        {new Date(log.timestamp).toLocaleString()}
      </Text>
    </HStack>
  </Box>
);

export default CallLogCard;

