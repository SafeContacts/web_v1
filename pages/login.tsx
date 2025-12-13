// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
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
  Divider,
} from '@chakra-ui/react';
import { PhoneIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [regData, setRegData] = useState({ name: '', phone: '', password: '', confirm: '' });
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      localStorage.setItem('accessToken', res.data.accessToken);
      toast({
        status: 'success',
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
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

  const handleRegister = async () => {
    if (!regData.name || !regData.phone || !regData.password || !regData.confirm) {
      toast({
        status: 'warning',
        title: 'Validation Error',
        description: 'Please fill in all fields',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (regData.password !== regData.confirm) {
      toast({
        status: 'warning',
        title: 'Passwords do not match',
        description: 'Please make sure both password fields match',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (regData.password.length < 6) {
      toast({
        status: 'warning',
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name: regData.name,
        phone: regData.phone,
        password: regData.password,
      });
      localStorage.setItem('accessToken', res.data.accessToken);
      toast({
        status: 'success',
        title: 'Account created!',
        description: 'Welcome to SafeContacts. Your account has been created successfully.',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Registration failed',
        description: err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create account',
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
        <title>Login - SafeContacts</title>
      </Head>
      <Box w="100%" maxW="md">
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" boxShadow="xl">
          <CardHeader textAlign="center" pb={2}>
            <Flex direction="column" align="center" mb={4}>
              <Box
                w={16}
                h={16}
                bgGradient="linear(to-br, primary.500, brand.500)"
                borderRadius="2xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={4}
                boxShadow="lg"
              >
                <Text color="white" fontWeight="bold" fontSize="2xl">
                  SC
                </Text>
              </Box>
              <Heading size="xl" mb={2}>
                Welcome to SafeContacts
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Manage your contacts with trust and confidence
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Tabs variant="enclosed" colorScheme="primary" isFitted>
              <TabList mb={6}>
                <Tab fontWeight="medium">Login</Tab>
                <Tab fontWeight="medium">Register</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <VStack spacing={5} align="stretch">
                    <FormControl id="login-phone" isRequired>
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
                    <FormControl id="login-password" isRequired>
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
                    >
                      Sign In
                    </Button>
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <VStack spacing={5} align="stretch">
                    <FormControl id="reg-name" isRequired>
                      <FormLabel>Full Name</FormLabel>
                      <Input
                        placeholder="John Doe"
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                        size="lg"
                      />
                    </FormControl>
                    <FormControl id="reg-phone" isRequired>
                      <FormLabel>Phone Number</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <PhoneIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={regData.phone}
                          onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                          size="lg"
                        />
                      </InputGroup>
                    </FormControl>
                    <FormControl id="reg-password" isRequired>
                      <FormLabel>Password</FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <LockIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={regData.password}
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })}
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
                    <FormControl id="reg-confirm" isRequired>
                      <FormLabel>Confirm Password</FormLabel>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <LockIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={regData.confirm}
                          onChange={(e) => setRegData({ ...regData, confirm: e.target.value })}
                        />
                        <InputRightElement width="4.5rem">
                          <IconButton
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            h="1.75rem"
                            size="sm"
                            icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            variant="ghost"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <Button
                      size="lg"
                      isLoading={loading}
                      loadingText="Creating account..."
                      onClick={handleRegister}
                      w="100%"
                    >
                      Create Account
                    </Button>
                    <Divider />
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      By registering, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
}
