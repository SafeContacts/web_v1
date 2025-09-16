// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  VStack,
  useToast,
  Text
} from '@chakra-ui/react';

export default function AuthPage() {
  const [loading, setLoading]     = useState(false);
  const [regData, setRegData]     = useState({ name: '', phone: '', password: '', confirm: '' });
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const toast = useToast();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        phone:    loginData.phone,
        password: loginData.password
      });
      // store token (or use context) and redirect
      localStorage.setItem('accessToken', res.data.accessToken);
      toast({ status: 'success', title: 'Logged in!' });
      router.push('/');
      localStorage.setItem('accessToken', res.data.accessToken);
    } catch (err: any) {
      toast({ status: 'error', title: 'Login failed', description: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (regData.password !== regData.confirm) {
      toast({ status: 'warning', title: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name:     regData.name,
        phone:    regData.phone,
        password: regData.password
      });
      localStorage.setItem('accessToken', res.data.accessToken);
      toast({ status: 'success', title: 'Registered!' });
      router.push('/');
    } catch (err: any) {
      toast({ status: 'error', title: 'Registration failed', description: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={12} p={6} borderWidth="1px" borderRadius="md">
      <Heading textAlign="center" mb={6}>Welcome to SafeContacts</Heading>
      <Tabs variant="enclosed" isFitted>
        <TabList mb="1em">
          <Tab>Login</Tab>
          <Tab>Register</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl id="login-phone" isRequired>
                <FormLabel>Phone</FormLabel>
                <Input
                  placeholder="+1-202-555-0143"
                  value={loginData.phone}
                  onChange={e => setLoginData({ ...loginData, phone: e.target.value })}
                />
              </FormControl>
              <FormControl id="login-password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                />
              </FormControl>
              <Button
                colorScheme="brand"
                isLoading={loading}
                onClick={handleLogin}
              >
                Sign In
              </Button>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl id="reg-name" isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Your Name"
                  value={regData.name}
                  onChange={e => setRegData({ ...regData, name: e.target.value })}
                />
              </FormControl>
              <FormControl id="reg-phone" isRequired>
                <FormLabel>Phone</FormLabel>
                <Input
                  placeholder="+1-202-555-0143"
                  value={regData.phone}
                  onChange={e => setRegData({ ...regData, phone: e.target.value })}
                />
              </FormControl>
              <FormControl id="reg-password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regData.password}
                  onChange={e => setRegData({ ...regData, password: e.target.value })}
                />
              </FormControl>
              <FormControl id="reg-confirm" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regData.confirm}
                  onChange={e => setRegData({ ...regData, confirm: e.target.value })}
                />
              </FormControl>
              <Button
                colorScheme="brand"
                isLoading={loading}
                onClick={handleRegister}
              >
                Create Account
              </Button>
              <Text fontSize="sm" color="gray.500">
                By registering, you agree to our Terms of Service.
              </Text>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

