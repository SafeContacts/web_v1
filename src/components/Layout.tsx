// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import { Flex, IconButton, HStack, Text, Box, useColorMode, useColorModeValue, Link as ChakraLink, } from '@chakra-ui/react';
import { SunIcon, MoonIcon, HamburgerIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';

const links = [
  { label: 'Contacts', href: '/' },
  { label: 'Sync',      href: '/sync' },
  { label: 'Updates',   href: '/updates' },
  { label: 'Admin',     href: '/admin/dashboard' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgHeader = useColorModeValue('white', 'gray.800');
  const bgMain   = useColorModeValue('gray.50','gray.900');

  return (
    <Flex direction="column" minH="100vh">
      {/* Header */}
      <Flex
        as="header"
        bg={bgHeader}
        px={6}
        py={4}
        align="center"
        justify="space-between"
        borderBottomWidth="1px"
      >
        <HStack spacing={4}>
          <IconButton aria-label="Menu" icon={<HamburgerIcon />} variant="ghost" />
          <Text fontSize="lg" fontWeight="bold">SafeContacts</Text>
        </HStack>
        <HStack spacing={4}>
          {links.map(({ label, href }) => (
            <ChakraLink
              key={href}
              as={NextLink}
              href={href}
              fontWeight="medium"
              _hover={{ textDecoration:'none', color:'brand.400' }}
            >
              {label}
            </ChakraLink>
          ))}
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </HStack>
      </Flex>

      {/* Main: full width */}
      <Flex
        as="main"
        flex="1"
        w="100%"
        bg={bgMain}
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 10 }}
      >
        <Box flex="1">
          {children}
        </Box>
      </Flex>

      {/* Footer */}
      <Flex as="footer" bg={bgHeader} py={4} justify="center" borderTopWidth="1px" >
        <Text fontSize="sm" color="gray.500">
          © {new Date().getFullYear()} SafeContacts Inc.
        </Text>
      </Flex>
    </Flex>
  );
}

