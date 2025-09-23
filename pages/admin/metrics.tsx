import { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Spinner } from '@chakra-ui/react';
import api from '../../src/lib/api';

export default function MetricsPage() {
  const [dau, setDau] = useState<number|null>(null);
  useEffect(()=>{
    api.get('/api/admin/metrics/dau').then(r=>setDau(r.data.dau));
  },[]);
  if (dau===null) return <Spinner />;
  return (
    <Box p={6}>
      <Heading mb={4}>Analytics</Heading>
      <SimpleGrid columns={3} spacing={6}>
        <Stat>
          <StatLabel>DAU (24h)</StatLabel>
          <StatNumber>{dau}</StatNumber>
        </Stat>
        {/* add Sync Count, Network Applies... */}
      </SimpleGrid>
    </Box>
  );
}

