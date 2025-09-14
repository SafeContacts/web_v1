import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Spinner } from '@chakra-ui/react';

// load client-only
const ForceGraph2D = dynamic(
  //() => import('react-force-graph').then(mod => mod.ForceGraph2D),
  () => import('react-force-graph-2d'),
  { ssr: false }
);

export default function NetworkGraph({ data }: { data: any }) {
  if (!data) return <Spinner />;
  return (
    <Box w="100%" h="600px">
      <ForceGraph2D
        graphData={data}
        nodeLabel="name"
        nodeAutoColorBy="id"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
      />
    </Box>
  );
}

