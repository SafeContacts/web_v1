import { useState } from 'react';
import axios from 'axios';
import { Box, Input, Button, VStack } from '@chakra-ui/react';
import ContactCard from '../components/ContactCard';

export default function Discovery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const res = await axios.get('/api/contacts/discovery', { params: { query } });
    setResults(res.data);
  };

  return (
    <Box p={6}>
      <Input placeholder="Search network" mb={4} value={query} onChange={e=>setQuery(e.target.value)} />
      <Button mb={4} onClick={search}>Search</Button>
      <VStack spacing={4}>
        {results.map(r => <ContactCard key={r._id} contact={r} />)}
      </VStack>
    </Box>
  );
}
