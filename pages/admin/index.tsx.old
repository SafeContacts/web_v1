import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Heading, VStack, Spinner, Alert, AlertIcon, Table,
  Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';
import CallLogCard from '../../components/CallLogCard';

export default function AdminDashboard() {
  const [users, setUsers]    = useState<any[]>([]);
  const [logs, setLogs]      = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/users'),
      axios.get('/api/admin/logs/calls')
    ])
    .then(([u, l]) => {
      setUsers(u.data);
      setLogs(l.data);
    })
    .catch(err => {
      console.error(err);
      setError('Failed to load admin data');
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="xl" />;
  if (error)  return <Alert status="error"><AlertIcon />{error}</Alert>;

  return (
    <Box p={6}>
      <Heading mb={4}>Admin Dashboard</Heading>
      <Heading size="md" mb={2}>Users</Heading>
      <Table variant="simple" mb={6}>
        <Thead><Tr><Th>Name</Th><Th>Phone</Th><Th>Public</Th></Tr></Thead>
        <Tbody>
          {users.map(u => (
            <Tr key={u._id}>
              <Td>{u.name}</Td>
              <Td>{u.phone}</Td>
              <Td>{u.publicProfile ? 'Yes' : 'No'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Heading size="md" mb={2}>Recent Calls</Heading>
      <VStack spacing={3} align="stretch">
        {logs.map(log => <CallLogCard key={log._id} log={log} />)}
      </VStack>
    </Box>
  );
}

