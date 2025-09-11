import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import useDuplicateViewModel from '../viewmodels/DuplicateViewModel';

export default function Duplicates() {
  const { groups, loading } = useDuplicateViewModel();

  if (loading) {
    return <Box p={6}>Loading duplicates…</Box>;
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Duplicate Groups</Heading>
      {groups.length === 0 ? (
        <Text>No duplicates found.</Text>
      ) : (
        <VStack spacing={2}>
          {groups.map((ids) => (
            <Text key={ids.join('-')}>{ids.join(', ')}</Text>
          ))}
        </VStack>
      )}
    </Box>
  );
}

