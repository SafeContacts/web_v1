import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Heading, Spinner, Alert, AlertIcon, Input, Button, VStack } from '@chakra-ui/react';
import NetworkGraph from '../components/NetworkGraph';

export default function NetworkPage() {
  const [userId, setUserId] = useState('');
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/network', { params: { userId } });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6}>
      <Heading mb={4}>User Network Graph</Heading>
      <VStack mb={4}>
        <Input
          placeholder="Enter User ID"
          value={userId}
          onChange={e=>setUserId(e.target.value)}
        />
        <Button onClick={fetchGraph}>Load Graph</Button>
      </VStack>

      {loading && <Spinner size="xl" />}
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      {data && <NetworkGraph data={data} />}
    </Box>
  );
}

