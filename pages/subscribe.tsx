// pages/subscribe.tsx
import { useState } from 'react';
import axios from 'axios';
import { Box, Heading, Button, useToast } from '@chakra-ui/react';

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const customerName  = 'Test User';        // Replace with real data
      const customerPhone = '9999999999';
      const customerEmail = 'test@example.com';
      const amount        = 5.00;               // INR 5

      // Call your API route under /api/cashfree/create-link
      const { data } = await axios.post('/api/cashfree/create-link', {
        customerName,
        customerPhone,
        customerEmail,
        amount
      });

      // Redirect to Cashfree’s hosted payment link
      window.location.href = data.link_url;
    } catch (err: any) {
      console.error('Subscription error', err.response?.data || err.message);
      toast({
        status: 'error',
        title: 'Subscription failed',
        description: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} textAlign="center">
      <Heading mb={4}>Upgrade to Premium</Heading>
      <Button colorScheme="blue" onClick={handleSubscribe} isLoading={loading}>
        Subscribe ₹5
      </Button>
    </Box>
  );
}

/*
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const orderId = `order_${Date.now()}`;
      const orderAmount = 5.00; // INR 5

      // 1) Create order & get payment_link
      const { data } = await axios.post('/api/cashfree/create-order', {
        orderId,
        orderAmount,
        customerPhone: '9999999999', // replace with real user phone
        customerEmail: 'user@example.com'
      });

      // 2) Redirect the browser to Cashfree’s hosted checkout
      window.location.href = data.payment_link;
    } catch (err: any) {
      console.error('Subscription error', err.response?.data || err.message);
      toast({
        status: 'error',
        title: 'Subscription failed',
        description: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };
*/

