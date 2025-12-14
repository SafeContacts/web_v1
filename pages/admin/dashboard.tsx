import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import {
  Box, Heading, VStack, Spinner, Alert, AlertIcon, Table,
  Thead, Tbody, Tr, Th, Td, Button, HStack, Text, useColorModeValue,
  Card, CardBody, Badge, Link
} from '@chakra-ui/react';
import CallLogCard from '../../components/CallLogCard';
import NetworkGraph from '../../components/NetworkGraph';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [networkData, setNetworkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNetwork, setShowNetwork] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Verify admin role first
    axios.get('/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        // User is admin, load data
        return Promise.all([
          axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/logs/calls', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/network/graph?fullNetwork=true', { headers: { Authorization: `Bearer ${token}` } })
        ]);
      })
      .then(([u, l, n]) => {
        setUsers(u.data);
        setLogs(l.data);
        setNetworkData(n.data);
      })
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push('/admin/login');
        } else {
          setError('Failed to load admin data');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <Spinner size="xl" />;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;

  return (
    <Box p={6}>
      <Head>
        <title>Admin Dashboard - SafeContacts</title>
      </Head>
      <HStack justify="space-between" mb={6}>
        <Heading>Admin Dashboard</Heading>
        <HStack>
          <Button onClick={() => setShowNetwork(!showNetwork)}>
            {showNetwork ? 'Hide' : 'Show'} Full Network
          </Button>
          <Button onClick={() => router.push('/')} variant="outline">
            User View
          </Button>
        </HStack>
      </HStack>

      {showNetwork && networkData && (
        <Card bg={cardBg} mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>Full Network Graph</Heading>
            <Text fontSize="sm" color="gray.500" mb={4}>
              Total Nodes: {networkData.nodes?.length || 0} | Total Edges: {networkData.edges?.length || 0}
            </Text>
            <Box h="600px" borderWidth="1px" borderRadius="md">
              <NetworkGraph data={networkData} />
            </Box>
          </CardBody>
        </Card>
      )}

      <Card bg={cardBg} mb={6}>
        <CardBody>
          <Heading size="md" mb={4}>Users</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Stealth Mode</Th>
                <Th>Registered</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u._id}>
                  <Td>{u.username}</Td>
                  <Td>{u.phone}</Td>
                  <Td><Badge colorScheme={u.role === 'admin' ? 'red' : 'blue'}>{u.role}</Badge></Td>
                  <Td>{u.stealthMode ? 'Yes' : 'No'}</Td>
                  <Td>{u.personId ? 'Yes' : 'No'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Card bg={cardBg}>
        <CardBody>
          <Heading size="md" mb={4}>Recent Calls</Heading>
          <VStack spacing={3} align="stretch">
            {logs.length === 0 ? (
              <Text color="gray.500">No recent calls</Text>
            ) : (
              logs.map(log => <CallLogCard key={log._id} log={log} />)
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}

