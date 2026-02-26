import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Badge,
} from '@chakra-ui/react';
import {
  SunIcon,
  MoonIcon,
  HamburgerIcon,
  PhoneIcon,
  RepeatIcon,
  ViewIcon,
  SettingsIcon,
  SearchIcon,
  ChatIcon,
} from '@chakra-ui/icons';

interface LayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { label: 'Contacts', href: '/', icon: ViewIcon },
  { label: 'Discovery', href: '/discovery', icon: SearchIcon },
  { label: 'Network', href: '/network', icon: ViewIcon },
  { label: 'Connection Requests', href: '/connection-requests', icon: ChatIcon },
  { label: 'Dialer', href: '/dialer', icon: PhoneIcon },
  { label: 'Duplicates', href: '/duplicates', icon: RepeatIcon },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string>('');

  const bgHeader = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgMain = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    setIsAuthenticated(!!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserName(payload.name || payload.sub || 'User');
      } catch {
        setUserName('User');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    router.push('/login');
  };

  const isActive = (path: string) => router.pathname === path;

  return (
    <Flex direction="column" minH="100vh" bg={bgMain}>
      {/* Modern Header */}
      <Box
        as="header"
        borderBottomWidth="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={1000}
        boxShadow="sm"
        backdropFilter="blur(10px)"
        bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
      >
        <Flex
          maxW="7xl"
          mx="auto"
          px={{ base: 4, md: 6, lg: 8 }}
          py={4}
          align="center"
          justify="space-between"
        >
          {/* Logo and Mobile Menu */}
          <HStack spacing={4}>
            <IconButton
              aria-label="Menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              display={{ base: 'flex', lg: 'none' }}
              onClick={onOpen}
            />
            <HStack
              as={Link}
              href="/"
              spacing={3}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              textDecoration="none"
            >
              <Box
                w={10}
                h={10}
                bgGradient="linear(to-br, primary.500, brand.500)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
              >
                <Text color="white" fontWeight="bold" fontSize="lg">
                  SC
                </Text>
              </Box>
              <Text
                fontSize="xl"
                fontWeight="bold"
                bgGradient="linear(to-r, primary.600, brand.600)"
                bgClip="text"
                display={{ base: 'none', sm: 'block' }}
              >
                SafeContacts
              </Text>
            </HStack>
          </HStack>

          {/* Desktop Navigation */}
          <HStack spacing={1} display={{ base: 'none', lg: 'flex' }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Box
                  key={link.href}
                  as={Link}
                  href={link.href}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  fontWeight="medium"
                  fontSize="sm"
                  color={active ? 'primary.600' : 'gray.600'}
                  bg={active ? 'primary.50' : 'transparent'}
                  _hover={{
                    bg: active ? 'primary.100' : 'gray.100',
                    textDecoration: 'none',
                  }}
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Icon w={4} h={4} />
                  {link.label}
                </Box>
              );
            })}
          </HStack>

          {/* Right Side Actions */}
          <HStack spacing={2}>
            <IconButton
              aria-label="Toggle dark mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
            />
            {isAuthenticated ? (
              <Menu>
                <MenuButton>
                  <Avatar size="sm" name={userName} bgGradient="linear(to-br, primary.500, brand.500)" />
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<SettingsIcon />} onClick={() => router.push('/settings')}>
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Text
                as={Link}
                href="/login"
                fontSize="sm"
                fontWeight="medium"
                color="primary.600"
                _hover={{ color: 'primary.700', textDecoration: 'none' }}
              >
                Login
              </Text>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Text fontWeight="bold" fontSize="xl">
              SafeContacts
            </Text>
          </DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={2}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Box
                    key={link.href}
                    as={Link}
                    href={link.href}
                    onClick={onClose}
                    px={4}
                    py={3}
                    borderRadius="lg"
                    fontWeight="medium"
                    color={active ? 'primary.600' : 'gray.600'}
                    bg={active ? 'primary.50' : 'transparent'}
                    _hover={{
                      bg: active ? 'primary.100' : 'gray.100',
                      textDecoration: 'none',
                    }}
                    display="flex"
                    alignItems="center"
                    gap={3}
                  >
                    <Icon w={5} h={5} />
                    {link.label}
                  </Box>
                );
              })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box as="main" flex="1" w="100%" maxW="7xl" mx="auto" px={{ base: 4, md: 6, lg: 8 }} py={8}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        as="footer"
        bg={bgHeader}
        borderTopWidth="1px"
        borderColor={borderColor}
        py={6}
        mt="auto"
      >
        <Flex maxW="7xl" mx="auto" px={{ base: 4, md: 6, lg: 8 }} justify="center" align="center">
          <Text fontSize="sm" color="gray.500">
            © {new Date().getFullYear()} SafeContacts. All rights reserved.
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}
