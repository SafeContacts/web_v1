import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Box, Spinner, useColorModeValue } from '@chakra-ui/react';

// Load client-only
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false, loading: () => <Spinner size="xl" /> }
);

interface GraphData {
  nodes: Array<{
    id: string;
    type?: string;
    label?: string;
    trustScore?: number;
    fx?: number;
    fy?: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    relation?: string;
    weight?: number;
    level?: number;
    mutual?: boolean;
  }>;
}

export default function NetworkGraph({ data }: { data: GraphData | null }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <Box w="100%" h="600px" bg={bgColor} borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  // Find self node and center it
  const selfNode = data.nodes.find((n) => n.type === 'self');
  
  // Transform data for react-force-graph-2d
  const graphData = {
    nodes: data.nodes.map((node) => ({
      id: node.id,
      name: node.label || node.id,
      type: node.type,
      trustScore: node.trustScore || 0,
      fx: node.fx, // Fixed x position for centering
      fy: node.fy, // Fixed y position for centering
    })),
    links: data.links.map((link) => ({
      source: typeof link.source === 'string' ? link.source : link.source.id,
      target: typeof link.target === 'string' ? link.target : link.target.id,
      relation: link.relation,
      weight: link.weight || 1,
      level: link.level,
      mutual: link.mutual || false,
    })),
  };

  const nodeColor = useCallback((node: any) => {
    if (node.type === 'self') return '#805AD5'; // brand color - purple for user
    if (node.trustScore >= 80) return '#38A169'; // green
    if (node.trustScore >= 50) return '#D69E2E'; // yellow
    return '#E53E3E'; // red
  }, []);

  const linkColor = useCallback((link: any) => {
    if (link.relation === 'trust') return '#38A169'; // green for trust
    if (link.mutual) return '#ED8936'; // orange for mutual connections
    return '#3182CE'; // blue for one-way connections
  }, []);

  return (
    <Box
      w="100%"
      h="600px"
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      overflow="hidden"
    >
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node: any) => {
          let label = node.name;
          if (node.type === 'self') {
            label += '\n(You)';
          }
          if (node.trustScore > 0) {
            label += `\nTrust: ${node.trustScore}%`;
          }
          return label;
        }}
        nodeColor={nodeColor}
        nodeVal={(node: any) => {
          if (node.type === 'self') return 20; // Larger node for user
          return Math.max(8, (node.trustScore || 0) / 8);
        }}
        linkColor={linkColor}
        linkWidth={(link: any) => {
          if (link.relation === 'trust') return 4;
          // Weight-based width for contact edges
          const baseWidth = link.mutual ? 3 : 2;
          return baseWidth + Math.min(link.weight || 1, 5);
        }}
        linkLabel={(link: any) => {
          let label = '';
          if (link.relation === 'trust') {
            label = `Trust Level: ${link.level || 1}`;
          } else {
            label = `Weight: ${link.weight || 1}`;
            if (link.mutual) {
              label += ' (Mutual)';
            }
          }
          return label;
        }}
        linkDirectionalParticles={(link: any) => {
          if (link.relation === 'trust') return 3;
          if (link.mutual) return 2;
          return 1;
        }}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={3}
        cooldownTicks={150}
        d3Force={(d3: any) => {
          // Center force to keep graph centered
          d3.force('center', d3.forceCenter(0, 0));
          // Use stronger charge for self node to keep it central
          d3.force('charge', d3.forceManyBody().strength((node: any) => {
            return node.type === 'self' ? -800 : -200;
          }));
          // Link force for better edge layout
          d3.force('link', d3.forceLink().id((d: any) => d.id).distance((link: any) => {
            return link.relation === 'trust' ? 100 : 80;
          }));
        }}
        onNodeDrag={(node: any) => {
          // Prevent dragging the self node
          if (node.type === 'self') {
            node.fx = 0;
            node.fy = 0;
          }
        }}
        onNodeDragEnd={(node: any) => {
          // Keep self node fixed in center
          if (node.type === 'self') {
            node.fx = 0;
            node.fy = 0;
          } else {
            // Allow other nodes to move freely after drag
            node.fx = undefined;
            node.fy = undefined;
          }
        }}
        onEngineStop={() => console.log('Graph layout stabilized')}
      />
    </Box>
  );
}
