/*** File: pages/duplicates.tsx */
import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Text, Button, HStack } from '@chakra-ui/react';
import api from '../src/lib/api';


/**
 * Decode the user ID from the JWT in localStorage.
 * If no token is present, fall back to a demo user ID so the page still works.
 */
function getCurrentUserId(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'demo-user';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || 'demo-user';
  } catch {
    return 'demo-user';
  }
}


export default function Duplicates() {
  const [userId, setUserId] = useState<string>('demo-user');
  const [groups, setGroups] = useState<string[][]>([]);
  const [contactsMap, setContactsMap] = useState<Record<string, any>>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/duplicates').then(res => {
      setGroups(res.data);
    });

    // Decode the user ID when the component mounts.
    const uid = getCurrentUserId();
    setUserId(uid);
    async function fetchContacts() {
      try {
        setLoading(true);
        const res = await fetch(`/api/contacts?userId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        } else {
          console.error('Failed to fetch contacts', await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

/*
    api.get('/api/contacts').then(res => {
      const map: Record<string, any> = {};
      res.data.forEach((c: any) => {
        map[c._id || c.id] = c;
      });
      setContactsMap(map);
    });
  }, []);
*/
  async function merge(group: string[]) {
    await api.post('/api/duplicates/merge', { group });
    const res = await api.get('/api/duplicates');
    setGroups(res.data);
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Duplicate Contacts</Heading>
      <VStack spacing={4} align="start">
        {groups.length === 0 && <Text>No duplicates detected</Text>}
        {groups.map((group, idx) => (
          <Box key={idx} borderWidth="1px" borderRadius="md" p={3} w="100%">
            <HStack mb={2}>
              {group.map(id => (
                <Box key={id} p={1} borderWidth="1px" borderRadius="md">
                  {contactsMap[id]?.name || id}
                </Box>
              ))}
            </HStack>
            <Button colorScheme="blue" size="sm" onClick={() => merge(group)}>
              Merge
            </Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

