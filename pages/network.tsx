/*** File: pages/network.tsx */
import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import api from '../src/lib/api';

type Graph = {
  nodes: { id: string }[];
  edges: { source: string; target: string }[];
};

export default function Network() {
  const [graph, setGraph] = useState<Graph | null>(null);
  useEffect(() => {
    api.get('/api/network/graph')
      .then(res => setGraph(res.data))
      .catch(err => console.error('Failed to fetch graph', err));
  }, []);
  return (
    <Box p={6}>
      <Heading mb={4}>Trust Network</Heading>
      {graph ? (
        <>
          <Heading size="md" mb={2}>Nodes</Heading>
          <VStack align="start" spacing={1}>
            {graph.nodes.map(node => (
              <Text key={node.id}>{node.id}</Text>
            ))}
          </VStack>
          <Heading size="md" mt={4} mb={2}>Edges</Heading>
          <VStack align="start" spacing={1}>
            {graph.edges.map((edge, idx) => (
              <Text key={idx}>{edge.source} → {edge.target}</Text>
            ))}
          </VStack>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </Box>
  );
}
