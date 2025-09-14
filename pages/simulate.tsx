// pages/simulate.tsx

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  VStack,
  useToast
} from '@chakra-ui/react';

type Contact = {
  _id: string;
  name: string;
  phone: string;
};

export default function Simulator() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [field, setField] = useState<'phone'|'email'>('phone');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const toast = useToast();

  // Fetch some contacts via discovery
  useEffect(() => {
    axios.get<Contact[]>('/api/contacts/discovery', { params: { query: '' } })
      .then(res => {
        setContacts(res.data);
        if (res.data[0]) setSelected(res.data[0]._id);
      })
      .catch(err => {
        console.error('Failed to load contacts', err);
      });
  }, []);

  const generate = async () => {
    if (!selected || !oldValue || !newValue) {
      toast({ status: 'warning', title: 'Fill all fields' });
      return;
    }
    try {
      await axios.post(`/api/contacts/${selected}/update`, {
        field,
        oldValue,
        newValue,
        stealth: true
      });
      toast({ status: 'success', title: 'Update event generated' });
      // Reset inputs
      setOldValue('');
      setNewValue('');
    } catch (err) {
      console.error(err);
      toast({ status: 'error', title: 'Failed to generate event' });
    }
  };

  return (
    <Box p={6} maxW="md" mx="auto">
      <Heading mb={6}>Mock Update Generator</Heading>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Contact</FormLabel>
          <Select value={selected} onChange={e => setSelected(e.target.value)}>
            {contacts.map(c => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Field</FormLabel>
          <Select value={field} onChange={e => setField(e.target.value as any)}>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Old Value</FormLabel>
          <Input
            placeholder="e.g. +1-202-555-0000 or old@example.com"
            value={oldValue}
            onChange={e => setOldValue(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>New Value</FormLabel>
          <Input
            placeholder="e.g. +1-202-555-1234 or new@example.com"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="blue" onClick={generate}>
          Generate Update Event
        </Button>
      </VStack>
    </Box>
  );
}

