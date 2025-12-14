import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  Switch,
  VStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  Text,
  Divider,
  HStack,
  useColorModeValue,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';

export default function Settings() {
  const router = useRouter();
  const toast = useToast();
  const [stealth, setStealth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    // Load user settings
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Load stealth mode from API (User model)
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStealth(data.stealthMode || false);
          setUser(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        // Fallback to localStorage
        const savedStealth = localStorage.getItem('stealthMode');
        if (savedStealth !== null) {
          setStealth(savedStealth === 'true');
        }
      }
    };
    
    loadSettings();
  }, [router]);

  const handleStealthToggle = async () => {
    const newValue = !stealth;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stealthMode: newValue }),
      });
      
      if (res.ok) {
        setStealth(newValue);
        toast({
          status: 'success',
          title: 'Settings Updated',
          description: `Stealth mode ${newValue ? 'enabled' : 'disabled'}`,
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Failed to update settings',
        description: err.message || 'An error occurred',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('stealthMode');
    router.push('/login');
    toast({
      status: 'info',
      title: 'Logged Out',
      description: 'You have been logged out successfully',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <Head>
        <title>Settings - SafeContacts</title>
      </Head>

      <Box mb={8}>
        <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
          Settings
        </Heading>
        <Text color="gray.500">Manage your preferences and account settings</Text>
      </Box>

      <VStack spacing={6} align="stretch">
        {/* Privacy Settings */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Privacy Settings</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel htmlFor="stealth-mode" mb={0} fontWeight="medium">
                    Stealth Mode
                  </FormLabel>
                  <Text fontSize="sm" color="gray.500">
                    Hide your activity from other users in the network
                  </Text>
                </Box>
                <Switch id="stealth-mode" isChecked={stealth} onChange={handleStealthToggle} />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Contact Management */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Contact Management</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Button
                variant="outline"
                onClick={() => router.push('/duplicates')}
                justifyContent="flex-start"
                size="lg"
              >
                Manage Duplicates
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/sync')}
                justifyContent="flex-start"
                size="lg"
              >
                Sync Contacts
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/updates')}
                justifyContent="flex-start"
                size="lg"
              >
                Review Updates
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Discovery & Network */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Discovery & Network</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Button
                variant="outline"
                onClick={() => router.push('/discovery')}
                justifyContent="flex-start"
                size="lg"
              >
                Contact Discovery
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/business')}
                justifyContent="flex-start"
                size="lg"
              >
                Business Discovery
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/network')}
                justifyContent="flex-start"
                size="lg"
              >
                Trust Network
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/network-updates')}
                justifyContent="flex-start"
                size="lg"
              >
                Network Updates
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Account Actions */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Account</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Button
                variant="outline"
                onClick={() => router.push('/subscribe')}
                justifyContent="flex-start"
                size="lg"
                colorScheme="brand"
              >
                Subscription & Billing
              </Button>
              <Divider />
              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleLogout}
                justifyContent="flex-start"
                size="lg"
              >
                Log Out
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
