// components/UpdateEventCard.tsx
import { Box, Text, HStack, Button, VStack } from '@chakra-ui/react';
import React from 'react';

export interface UpdateEvent {
  id: string;
  contactId: string;
  contactName: string;
  field: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
}

const UpdateEventCard: React.FC<{
  event: UpdateEvent;
  onApply: (evt: UpdateEvent) => void;
  onIgnore: (evt: UpdateEvent) => void;
}> = ({ event, onApply, onIgnore }) => (
  <Box p={4} borderWidth="1px" borderRadius="md" w="100%" bg="gray.50">
    <Text fontWeight="bold" mb={1}>{event.id}</Text>
    <Text fontWeight="bold" mb={1}>{event.contactId}</Text>
    <Text fontWeight="bold" mb={1}>{event.contactName}</Text>
    <Text mb={2}>
      <strong>{event.field}</strong> changed from <em>{event.oldValue}</em> to <em>{event.newValue}</em>
    </Text>
    <HStack spacing={2}>
      <Button size="sm" colorScheme="green" onClick={() => onApply(event)}>
        Apply
      </Button>
      <Button size="sm" variant="outline" onClick={() => onIgnore(event)}>
        Ignore
      </Button>
    </HStack>
  </Box>
);

export default UpdateEventCard;

