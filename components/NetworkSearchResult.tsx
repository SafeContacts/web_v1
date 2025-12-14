// components/NetworkSearchResult.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

interface NetworkSearchResult {
  _id: string;
  personId: string;
  name: string;
  connectionLevel: number;
  isConnected: boolean;
  trustScore: number;
  phones: Array<{ value: string; label?: string }>;
  emails: Array<{ value: string; label?: string }>;
  addresses: string[];
  socials: any;
  connectionRequest: {
    status: string;
    id: string;
    incoming?: boolean;
  } | null;
}

interface NetworkSearchResultProps {
  result: NetworkSearchResult;
  onConnect?: () => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export default function NetworkSearchResultCard({ result, onConnect, onApprove, onReject }: NetworkSearchResultProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleConnect = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        toast({
          status: 'error',
          title: 'Authentication Required',
          description: 'Please log in to send connection requests',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const res = await fetch('/api/network/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toPersonId: result.personId,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        toast({
          status: 'success',
          title: 'Connection Request Sent',
          description: `Your request to connect with ${result.name} has been sent`,
          duration: 3000,
          isClosable: true,
        });
        onClose();
        setMessage('');
        if (onConnect) onConnect();
      } else {
        const err = await res.json();
        toast({
          status: 'error',
          title: 'Failed to Send Request',
          description: err.message || 'Failed to send connection request',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Error',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!result.connectionRequest) return;
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return;

      const res = await fetch('/api/network/connect', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: result.connectionRequest.id,
          action: 'approve',
        }),
      });

      if (res.ok) {
        toast({
          status: 'success',
          title: 'Connection Approved',
          description: `You are now connected with ${result.name}`,
          duration: 3000,
          isClosable: true,
        });
        if (onApprove) onApprove(result.connectionRequest.id);
      } else {
        const err = await res.json();
        toast({
          status: 'error',
          title: 'Failed to Approve',
          description: err.message || 'Failed to approve connection',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Error',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!result.connectionRequest) return;
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return;

      const res = await fetch('/api/network/connect', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: result.connectionRequest.id,
          action: 'reject',
        }),
      });

      if (res.ok) {
        toast({
          status: 'info',
          title: 'Connection Rejected',
          description: 'Connection request has been rejected',
          duration: 3000,
          isClosable: true,
        });
        if (onReject) onReject(result.connectionRequest.id);
      } else {
        const err = await res.json();
        toast({
          status: 'error',
          title: 'Failed to Reject',
          description: err.message || 'Failed to reject connection',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Error',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnectionBadge = () => {
    if (result.isConnected) {
      return <Badge colorScheme="green">1st Connection</Badge>;
    }
    if (result.connectionLevel === 2) {
      return <Badge colorScheme="blue">2nd Connection</Badge>;
    }
    return <Badge colorScheme="gray">Not Connected</Badge>;
  };

  const getConnectionRequestStatus = () => {
    if (!result.connectionRequest) return null;
    if (result.connectionRequest.incoming) {
      return (
        <HStack spacing={2}>
          <Text fontSize="sm" color="orange.500">
            Incoming Request
          </Text>
          <Button size="sm" colorScheme="green" leftIcon={<CheckIcon />} onClick={handleApprove} isLoading={loading}>
            Approve
          </Button>
          <Button size="sm" variant="outline" leftIcon={<CloseIcon />} onClick={handleReject} isLoading={loading}>
            Reject
          </Button>
        </HStack>
      );
    }
    if (result.connectionRequest.status === 'pending') {
      return (
        <Badge colorScheme="yellow" fontSize="sm">
          Request Pending
        </Badge>
      );
    }
    if (result.connectionRequest.status === 'approved') {
      return (
        <Badge colorScheme="green" fontSize="sm">
          Connected
        </Badge>
      );
    }
    if (result.connectionRequest.status === 'rejected') {
      return (
        <Badge colorScheme="red" fontSize="sm">
          Request Rejected
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <HStack>
                  <Text fontWeight="bold" fontSize="lg">
                    {result.name}
                  </Text>
                  {getConnectionBadge()}
                </HStack>
                {result.trustScore > 0 && (
                  <Badge colorScheme={result.trustScore >= 80 ? 'green' : result.trustScore >= 50 ? 'yellow' : 'red'} fontSize="xs">
                    Trust: {result.trustScore}%
                  </Badge>
                )}
              </VStack>
            </HStack>

            {/* Contact Information - Only show if connected */}
            {result.isConnected && (
              <Box>
                {result.phones && result.phones.length > 0 && (
                  <VStack align="start" spacing={1} mb={2}>
                    {result.phones.map((phone, idx) => (
                      <Text key={idx} fontSize="sm" color="gray.600">
                        📞 {phone.value} {phone.label && `(${phone.label})`}
                      </Text>
                    ))}
                  </VStack>
                )}
                {result.emails && result.emails.length > 0 && (
                  <VStack align="start" spacing={1} mb={2}>
                    {result.emails.map((email, idx) => (
                      <Text key={idx} fontSize="sm" color="gray.600">
                        ✉️ {email.value} {email.label && `(${email.label})`}
                      </Text>
                    ))}
                  </VStack>
                )}
              </Box>
            )}

            {/* Privacy Notice */}
            {!result.isConnected && (
              <Box p={2} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                <Text fontSize="xs" color="yellow.800">
                  🔒 Contact details are hidden. Connect to view phone numbers and email addresses.
                </Text>
              </Box>
            )}

            {/* Connection Actions */}
            <HStack justify="flex-end" spacing={2}>
              {getConnectionRequestStatus()}
              {!result.isConnected && !result.connectionRequest && (
                <Button size="sm" colorScheme="brand" leftIcon={<AddIcon />} onClick={onOpen} isLoading={loading}>
                  Connect
                </Button>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Connect Request Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Connection Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Send a connection request to <strong>{result.name}</strong>
              </Text>
              <FormControl>
                <FormLabel>Message (Optional)</FormLabel>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to your connection request..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleConnect} isLoading={loading}>
              Send Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

