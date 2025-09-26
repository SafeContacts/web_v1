import { Box, Input, Button, VStack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';

export default function Business() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState<any[]>([]);

  const search = async () => {
    const res = await axios.get('/api/business', { params: { search: query } });
    setList(res.data);
  };

  return (
    <Box p={6}>
      <Input mb={4} placeholder="Search businesses" value={query} onChange={e=>setQuery(e.target.value)} />
      <Button mb={4} onClick={search}>Search</Button>
      <VStack spacing={4}>
        {list.map(b => (
          <Box key={b.businessId} p={4} borderWidth="1px" borderRadius="md" w="100%">
            <Text fontWeight="bold">{b.name}</Text>
            <Text>Rating: {b.rating}</Text>
            <Button size="sm" mt={2} onClick={()=>axios.post(`/api/business/${b.businessId}/claim`)}>Claim</Button>
          </Box>
        ))}

      </VStack>
    </Box>
  )
}
