// components/PaywallOverlay.tsx
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

export default function PaywallOverlay() {
  const router = useRouter();
  return (
    <Box p={6} textAlign="center">
      <Heading>Premium Feature</Heading>
      <Text mb={4}>Subscribe to access this feature.</Text>
      <Button colorScheme="blue" onClick={() => router.push('/subscribe')}>
        Subscribe Now
      </Button>
    </Box>
  );
}

