/*** File: pages/network.tsx */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  VStack,
  Text,
  Card,
  CardBody,
  HStack,
  Badge,
  useColorModeValue,
  Spinner,
  Flex,
  Button,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import NetworkGraph from '../components/NetworkGraph';

type Graph = {
  nodes: { id: string; type?: string; label?: string; trustScore?: number }[];
  edges: { source: string; target: string; relation?: string; weight?: number; level?: number }[];
};

export default function Network() {
  const router = useRouter();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadGraph = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/network/graph', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setGraph(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to load network graph');
      }
    } catch (err: any) {
      console.error('Failed to fetch graph', err);
      setError('Failed to load network graph');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGraph();
  };

  if (loading) {
    return (
      <Box>
        <Head>
          <title>Trust Network - SafeContacts</title>
        </Head>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="gray.500">Loading network graph...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Head>
          <title>Trust Network - SafeContacts</title>
        </Head>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Text color="red.500">{error}</Text>
          </CardBody>
        </Card>
      </Box>
    );
  }

  const trustEdges = graph?.edges.filter((e) => e.relation === 'trust') || [];
  const contactEdges = graph?.edges.filter((e) => e.relation === 'contact') || [];
  const selfNode = graph?.nodes.find((n) => n.type === 'self');

  return (
    <Box>
      <Head>
        <title>Trust Network - SafeContacts</title>
      </Head>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            Trust Network
          </Heading>
          <Text color="gray.500">Visualize your trust relationships and connections</Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={handleRefresh}
          isLoading={refreshing}
          loadingText="Refreshing"
          size="md"
        >
          Refresh
        </Button>
      </Flex>

      {/* Stats */}
      {graph && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardBody>
            <HStack spacing={6}>
              <Stat>
                <StatLabel>Total Nodes</StatLabel>
                <StatNumber fontSize="2xl">{graph.nodes.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Trust Relationships</StatLabel>
                <StatNumber fontSize="2xl" color="green.500">
                  {trustEdges.length}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Contact Connections</StatLabel>
                <StatNumber fontSize="2xl" color="blue.500">
                  {contactEdges.length}
                </StatNumber>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Network Graph Visualization */}
      {graph && graph.nodes.length > 0 && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Interactive Network Graph
            </Heading>
            <NetworkGraph
              data={{
                nodes: graph.nodes,
                links: graph.edges.map((e: any) => ({
                  source: e.source,
                  target: e.target,
                  relation: e.relation,
                  weight: e.weight,
                  level: e.level,
                  mutual: e.mutual,
                })),
              }}
            />
          </CardBody>
        </Card>
      )}

      {/* Network Visualization */}
      {graph && graph.nodes.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderStyle="dashed">
          <CardBody textAlign="center" py={12}>
            <Heading size="md" mb={2} color="gray.500">
              No Network Data
            </Heading>
            <Text color="gray.500">Start building your trust network by adding trust relationships</Text>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={6} align="stretch">
          {/* Nodes */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>
                Network Nodes ({graph?.nodes.length || 0})
              </Heading>
              <VStack align="stretch" spacing={2}>
                {graph?.nodes.map((node) => (
                  <HStack
                    key={node.id}
                    p={3}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="lg"
                    justify="space-between"
                  >
                    <HStack spacing={3}>
                      <Text fontWeight="medium">{node.label || node.id}</Text>
                      {node.type === 'self' && (
                        <Badge colorScheme="brand" fontSize="xs">
                          You
                        </Badge>
                      )}
                      {node.trustScore !== undefined && (
                        <Badge colorScheme={node.trustScore >= 80 ? 'green' : node.trustScore >= 50 ? 'yellow' : 'red'} fontSize="xs">
                          {node.trustScore}%
                        </Badge>
                      )}
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Edges */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Heading size="md" mb={4}>
                Connections ({graph?.edges.length || 0})
              </Heading>
              <VStack align="stretch" spacing={2}>
                {graph?.edges.map((edge, idx) => (
                  <HStack
                    key={idx}
                    p={3}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="lg"
                    justify="space-between"
                  >
                    <HStack spacing={3}>
                      <Text fontSize="sm">
                        {edge.source} → {edge.target}
                      </Text>
                      {edge.relation && (
                        <Badge
                          colorScheme={edge.relation === 'trust' ? 'green' : 'blue'}
                          fontSize="xs"
                        >
                          {edge.relation}
                        </Badge>
                      )}
                      {edge.level && (
                        <Badge colorScheme="purple" fontSize="xs">
                          Level {edge.level}
                        </Badge>
                      )}
                      {edge.weight && (
                        <Badge colorScheme="gray" fontSize="xs">
                          Weight {edge.weight}
                        </Badge>
                      )}
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Box>
  );
}
