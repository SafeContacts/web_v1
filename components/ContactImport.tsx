// components/ContactImport.tsx
// Contact import component with encryption support
import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Textarea,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Card,
  CardBody,
  Heading,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

export default function ContactImport() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast({
        status: 'warning',
        title: 'No data',
        description: 'Please paste or upload contact data',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const contacts = JSON.parse(jsonInput);
      
      if (!Array.isArray(contacts)) {
        throw new Error('Contacts must be an array');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contacts }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        toast({
          status: 'success',
          title: 'Import Successful',
          description: `Imported ${data.imported} contacts, updated ${data.updated}`,
          duration: 5000,
        });
        setJsonInput(''); // Clear input
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Import Failed',
        description: err.message || 'Failed to import contacts',
        duration: 5000,
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonInput(text);
    };
    reader.readAsText(file);
  };

  const exampleFormat = `[
  {
    "name": "John Doe",
    "phones": [
      { "label": "mobile", "value": "+15551234567" }
    ],
    "emails": [
      { "label": "work", "value": "john@example.com" }
    ],
    "addresses": ["123 Main St, City, State"],
    "notes": "Contact notes"
  }
]`;

  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Heading size="md">Import Contacts</Heading>
          <Text fontSize="sm" color="gray.500">
            Import contacts from JSON. All sensitive data (phones, emails, addresses, notes) will be automatically encrypted.
          </Text>

          <Box>
            <HStack mb={2}>
              <Text fontSize="sm" fontWeight="medium">Upload JSON File:</Text>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ fontSize: '14px' }}
              />
            </HStack>
          </Box>

          <Textarea
            placeholder="Paste JSON contact data here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            fontFamily="mono"
            fontSize="sm"
          />

          <Button
            leftIcon={<AddIcon />}
            onClick={handleImport}
            isLoading={loading}
            loadingText="Importing..."
            colorScheme="blue"
          >
            Import Contacts
          </Button>

          {result && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">Import Complete!</Text>
                <Text fontSize="sm">Imported: {result.imported} contacts</Text>
                <Text fontSize="sm">Updated: {result.updated} contacts</Text>
                {result.errors && result.errors.length > 0 && (
                  <Text fontSize="sm" color="red.500">
                    Errors: {result.errors.length}
                  </Text>
                )}
              </VStack>
            </Alert>
          )}

          <Box mt={4} p={3} bg="gray.50" borderRadius="md">
            <Text fontSize="xs" fontWeight="bold" mb={2}>Expected Format:</Text>
            <Textarea
              value={exampleFormat}
              readOnly
              rows={8}
              fontSize="xs"
              fontFamily="mono"
              bg="white"
            />
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
}

