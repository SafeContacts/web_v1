// pages/admin/login.tsx
// Admin login page
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  VStack,
  useToast,
  Text,
  Card,
  CardBody,
  CardHeader,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { PhoneIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogin = async () => {
    if (!loginData.phone || !loginData.password) {
      toast({
        status: 'warning',
        title: 'Validation Error',
        description: 'Please fill in all fields',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        phone: loginData.phone,
        password: loginData.password,
      });
      
      // Verify user is admin
      // The token should contain role info, but we'll verify on the server side
      localStorage.setItem('accessToken', res.data.accessToken);
      
      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Login failed',
        description: err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid credentials',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      px={4}
    >
      <Head>
        <title>Admin Login - SafeContacts</title>
      </Head>
      <Box w="100%" maxW="md">
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="xl">
          <CardHeader textAlign="center" pb={2}>
            <Flex direction="column" align="center" mb={4}>
              <Box
                w={16}
                h={16}
                bgGradient="linear(to-br, red.500, orange.500)"
                borderRadius="2xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={4}
                boxShadow="lg"
              >
                <Text color="white" fontWeight="bold" fontSize="2xl">
                  A
                </Text>
              </Box>
              <Heading size="xl" mb={2}>
                Admin Login
              </Heading>
              <Text color="gray.500" fontSize="sm">
                SafeContacts Administration
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Alert status="warning" mb={4} borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">Admin access only. Unauthorized access is prohibited.</Text>
            </Alert>
            <VStack spacing={5} align="stretch">
              <FormControl id="admin-phone" isRequired>
                <FormLabel>Phone Number</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <PhoneIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={loginData.phone}
                    onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                    size="lg"
                  />
                </InputGroup>
              </FormControl>
              <FormControl id="admin-password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <LockIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      h="1.75rem"
                      size="sm"
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button
                size="lg"
                isLoading={loading}
                loadingText="Signing in..."
                onClick={handleLogin}
                w="100%"
                colorScheme="red"
              >
                Admin Sign In
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push('/login')}
                w="100%"
              >
                Regular User Login
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
}

