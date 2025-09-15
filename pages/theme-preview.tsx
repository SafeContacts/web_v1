// pages/theme-preview.tsx
import {
  Box, Heading, Text, Button, Badge, VStack, useColorMode, Switch, HStack
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useState } from 'react';

export default function ThemePreview() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [switched, setSwitched] = useState(false);

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Heading>Theme Preview</Heading>
        <Switch
          isChecked={colorMode === 'dark'}
          onChange={() => { toggleColorMode(); setSwitched(!switched); }}
        >Dark Mode</Switch>
      </HStack>

      <VStack spacing={4} align="start">
        <Heading size="3xl">Heading 3xl</Heading>
        <Heading size="2xl">Heading 2xl</Heading>
        <Heading size="xl">Heading xl</Heading>
        <Text fontSize="lg">Body text (lg): “The quick brown fox…”</Text>
        <Text fontSize="md">Body text (md): “The quick brown fox…”</Text>
        <Text fontSize="sm">Body text (sm): “The quick brown fox…”</Text>

        <HStack spacing={4}>
          <Button colorScheme="brand">Brand Button</Button>
          <Button colorScheme="accent">Accent Button</Button>
        </HStack>

        <HStack spacing={4}>
          <Badge colorScheme="brand">Brand Badge</Badge>
          <Badge colorScheme="accent">Accent Badge</Badge>
        </HStack>

        <Box>
          <Text>Try a link to <NextLink href="/"><Button variant="link">Home</Button></NextLink></Text>
        </Box>
      </VStack>
    </Box>
  );
}

