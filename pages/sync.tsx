import { useState } from 'react';
//import axios from 'axios';
import api from '../src/lib/api';

import {
  Box,
  Heading,
  VStack,
  Button,
  Input,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

type ContactItem = {
  phone: string;
  name:  string;
  email?: string;
  company?: string;
  address?: string;
  jobTitle?: string;
  birthday?: string;
  tags?: string[];
};

export default function SyncPage() {
  const [file, setFile]             = useState<File|null>(null);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [deltas, setDeltas]         = useState<any[]>([]);
  const [error, setError]           = useState<string|null>(null);
  const toast = useToast();

  const handleUpload = async () => {
    const raw = file
      ? await file.text()
      : text;
    let contacts: ContactItem[];
    try {
      contacts = JSON.parse(raw);
      if (!Array.isArray(contacts)) throw new Error('Not an array');
    } catch {
      toast({ status:'error', title:'Invalid JSON' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      //const res = await axios.post<ContactItem[]>('/api/sync/import', { contacts });
      const res = await api.post<ContactItem[]>('/api/sync/import', { contacts });
      setDeltas(res.data);
      toast({ status:'success', title:`Imported: ${res.data.length} changes` });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="lg" mx="auto" p={6}>
      <Heading mb={4}>Sync Your Contacts</Heading>
      <VStack spacing={4} align="stretch">
        <Input
          type="file"
          accept=".json"
          onChange={e => setFile(e.target.files?.[0]||null)}
        />
        <Textarea
          placeholder="Or paste JSON here…"
          rows={6}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button colorScheme="brand" onClick={handleUpload} isLoading={loading}>
          Import & Detect Changes
        </Button>

        {loading && <Spinner />}
        {error && (
          <Alert status="error">
            <AlertIcon />{error}
          </Alert>
        )}
        {deltas.length > 0 && (
          <>
            <Heading size="md" mt={6}>Detected Changes</Heading>
            {deltas.map((d,i) => (
              <Box key={i} p={2} bg="gray.50" borderRadius="md">
                <strong>{d.type.toUpperCase()}</strong> {d.phone} – {d.field || '—'} → {d.newValue}
              </Box>
            ))}
          </>
        )}
      </VStack>
    </Box>
  );
}

