// components/UpdateEventCard.tsx
import { Box, Text, HStack, Button, VStack, Card, CardBody, Badge, useColorModeValue, Icon } from '@chakra-ui/react';
import React from 'react';
import { ArrowForwardIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

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
}> = ({ event, onApply, onIgnore }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const fieldColors: Record<string, string> = {
    phone: 'blue',
    email: 'purple',
    name: 'green',
    company: 'orange',
    address: 'teal',
  };

  const fieldColor = fieldColors[event.field.toLowerCase()] || 'gray';

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="lg">
              {event.contactName}
            </Text>
            <Badge colorScheme={fieldColor} fontSize="xs">
              {event.field}
            </Badge>
          </HStack>

          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              Update Suggestion
            </Text>
            <HStack spacing={2} align="center">
              <Text fontSize="sm" color="gray.600" textDecoration="line-through">
                {event.oldValue || '(empty)'}
              </Text>
              <ArrowForwardIcon color="gray.400" />
              <Text fontSize="sm" fontWeight="semibold" color={`${fieldColor}.600`}>
                {event.newValue}
              </Text>
            </HStack>
          </Box>

          <Text fontSize="xs" color="gray.500">
            {new Date(event.createdAt).toLocaleString()}
          </Text>

          <HStack spacing={2} justify="flex-end">
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<CheckIcon />}
              onClick={() => onApply(event)}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CloseIcon />}
              onClick={() => onIgnore(event)}
            >
              Ignore
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default UpdateEventCard;

