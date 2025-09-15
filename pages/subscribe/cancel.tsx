// pages/subscribe/cancel.tsx
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function CancelPage() {
  const router = useRouter();
  return (
    <Box p={6} textAlign="center">
      <Heading>Subscription Cancelled</Heading>
      <Text mb={4}>You have not been charged.</Text>
      <Button onClick={() => router.push('/subscribe')}>Try Again</Button>
    </Box>
  );
}

