import { useEffect, useState } from 'react';
import {
  Box, Heading, VStack, Spinner, Alert, AlertIcon,
  Text, HStack, Badge, Button, useToast
} from '@chakra-ui/react';
import api from '../src/lib/api';

type Suggestion = {
  eventId: string;
  newValue:string;
  ts:      string;
  source:  string;
  trust:   number;
};

type Group = { phone:string; field:string; suggestions:Suggestion[] };

export default function ResolveGroupedPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string|null>(null);
  const toast = useToast();

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Group[]>('/api/sync/network-updates');
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const apply = async (g:Group, s:Suggestion) => {
    try {
      await api.patch('/api/contacts/phone', { // or id mapping
        phone:g.phone, field:g.field, value:s.newValue
      });
      await api.post(`/api/contacts/${g.phone}/update`, {
        field:g.field, oldValue:'', newValue:s.newValue, stealth:false
      });
      toast({status:'success',title:'Applied'});
      fetch();
    } catch (err: any) {
      toast({status:'error',title:'Failed'});
    }
  };

  useEffect(fetch, []);

  if (loading) return <Spinner />;
  if (error)   return <Alert status="error"><AlertIcon/>{error}</Alert>;
  if (groups.length===0) {
    return <Box p={6}><Heading>No network suggestions</Heading></Box>;
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Conflict Resolution</Heading>
      <VStack spacing={6} align="stretch">
        {groups.map((g, i) => (
          <Box key={i} p={4} borderWidth="1px" borderRadius="md">
            <Text fontWeight="bold">{g.phone} – <Badge>{g.field}</Badge></Text>
            {g.suggestions.map(s => (
              <HStack key={s.eventId} justify="space-between" mt={2}>
                <Text>{s.newValue}</Text>
                <HStack>
                  <Badge>Trust {s.trust}</Badge>
                  <Button size="sm" onClick={()=>apply(g,s)}>Apply</Button>
                </HStack>
              </HStack>
            ))}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

