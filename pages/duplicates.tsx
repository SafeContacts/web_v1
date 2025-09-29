// pages/duplicates.tsx
import { useState } from 'react';
import api from '../src/lib/api';
import { Box, Heading, VStack, Text, Button, Spinner, Alert, AlertIcon, useToast } from '@chakra-ui/react';
import useDuplicateViewModel from '../viewmodels/DuplicateViewModel';

export default function DuplicatesPage() {
  const { groups, loading, error, refetch } = useDuplicateViewModel();
  const toast = useToast();

  const mergeGroup = async (grp: string[]) => {
    try {
      await api.post('/api/duplicates/merge', { group: grp });
      toast({ status: 'success', title: 'Contacts merged' });
      await refetch();
    } catch (err: any) {
      console.error('Merge failed', err);
      toast({
        status: 'error',
        title: 'Merge failed',
        description: err.response?.data?.error || err.message
      });
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }
  if (groups.length === 0) {
    return (
      <Box p={6}>
        <Heading>No duplicate contacts found.</Heading>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Duplicate Contacts Groups</Heading>
      <VStack spacing={6} align="stretch">
        {groups.map((grp, idx) => (
          <Box key={idx} p={4} borderWidth="1px" borderRadius="md" bg="gray.50" >
            <Text mb={2} fontWeight="bold">Group {idx + 1}</Text>
            <VStack align="start" spacing={1} mb={4}>
              {grp.map(id => <Text key={id}>{id}</Text>)}
            </VStack>
	    <Button colorScheme="blue" size="sm" onClick={() => mergeGroup(grp)} >
              Merge 
            </Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

