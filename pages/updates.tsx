// pages/updates.tsx
import { useEffect, useState } from 'react';
import api from '../src/lib/api';
import { Box, Heading, VStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import UpdateEventCard, { UpdateEvent } from '../components/UpdateEventCard';
import { useToast } from '@chakra-ui/react';
import withPaywall from '../components/withPaywall';



export default function UpdatesPage() {
  const [events, setEvents] = useState<UpdateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const toast = useToast();


  useEffect(() => {
    api.get<UpdateEvent[]>('/api/updates')
      .then(res => setEvents(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load updates.');
      })
      .finally(() => setLoading(false));
  }, []);

   const applyEvent = async (evt: UpdateEvent) => {
    try {
      console.log('Patching contact at:', `/api/contacts/${evt.contactId}`);
      // 1) Patch the contact
      await api.patch(`/api/contacts/${evt.contactId}`, {
        [evt.field]: evt.newValue
      });

      console.log('Marking event as non-stealth:', `/api/contacts/${evt.contactId}/update`);
      // 2) Mark the update event as applied (stealth: false)
      await api.post(`/api/contacts/${evt.contactId}/update`, {
        field:    evt.field,
        oldValue: evt.oldValue,
        newValue: evt.newValue,
        stealth:  false
      });

      // 3) Remove it from UI
      setEvents(evts => evts.filter(e => e.id !== evt.id));
      toast({ status: 'success', title: 'Update applied' });
    } catch (err: any) {
      console.error('applyEvent error:', err.response || err);
      toast({
        status: 'error',
        title: 'Failed to apply update',
        description: err.response?.data?.error || err.message
      });
    }
  };
/* -- APPLY EVENT -- **
  const applyEvent = async (evt: UpdateEvent) => {
    // 1) Patch the contact
    await axios.patch(`/api/contacts/${evt.contactId}`, {
      [evt.field]: evt.newValue
    });
    // 2) Delete or mark the event as non-stealth
    await axios.post(`/api/contacts/${evt.contactId}/update`, {
      field: evt.field,
      oldValue: evt.oldValue,
      newValue: evt.newValue,
      stealth: false
    });
    // 3) Refresh
    setEvents(events.filter(e => e.id !== evt.id));
  };
*----- APPLY EVENT END--- */


  const ignoreEvent = async (evt: UpdateEvent) => {
    // Mark as non-stealth so it won’t reappear
    await api.post(`/api/contacts/${evt.contactId}/update`, {
      field: evt.field,
      oldValue: evt.oldValue,
      newValue: evt.newValue,
      stealth: false
    });
    setEvents(events.filter(e => e.id !== evt.id));
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center"><Spinner size="xl"/></Box>
    );
  }
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error"><AlertIcon />{error}</Alert>
      </Box>
    );
  }
  if (events.length === 0) {
    return (
      <Box p={6}><Heading>No pending updates.</Heading></Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Suggested Updates</Heading>
      <VStack spacing={4} align="stretch">
        {events.map(evt => (
          <UpdateEventCard
            key={evt.id}
            event={evt}
            onApply={applyEvent}
            onIgnore={ignoreEvent}
          />
        ))}
      </VStack>
    </Box>
  );
}
//export default withPaywall(UpdatesPage);
//export {withPaywall(UpdatesPage)};
