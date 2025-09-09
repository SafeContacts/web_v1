import { Box, Heading, Switch, VStack, Button } from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Settings() {
  const [stealth, setStealth] = useState(true);
  const router = useRouter();
  return (
    <Box p={6}>
      <Heading mb={4}>Settings</Heading>
      <VStack align="start" spacing={4}>
        <Switch isChecked={stealth} onChange={() => setStealth(!stealth)}>Stealth Mode</Switch>
        <Button onClick={() => router.push('/duplicates')}>Manage Duplicates</Button>
        <Button onClick={() => router.push('/business')}>Business Discovery</Button>
      </VStack>
    </Box>
  );
}
