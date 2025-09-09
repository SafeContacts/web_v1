import { useEffect } from 'react';
import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import useDuplicateViewModel from '../viewmodels/DuplicateViewModel';

export default function Duplicates() {
  const vm = useDuplicateViewModel();
  useEffect(() => { vm.scanAndAutoMerge(); }, []);
  return (
    <Box p={6}>
      <Heading mb={4}>Duplicates</Heading>
      <VStack spacing={2}>
        {vm.groups.map(g => <Text key={g.ids.join('-')}>{g.ids.join(', ')}</Text>)}
      </VStack>
    </Box>
  );
}
