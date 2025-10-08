import Link from 'next/link';
import React from 'react';
import { Flex, IconButton, HStack, Text, Box, useColorMode, useColorModeValue, Link as ChakraLink, } from '@chakra-ui/react';
import { SunIcon, MoonIcon, HamburgerIcon } from '@chakra-ui/icons';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Simple layout component for the SafeContacts pages.
 * Provides a basic navigation bar and wraps children in a main container.
 */
export default function Layout({ children }: LayoutProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgHeader = useColorModeValue('white', 'gray.800');
  const bgMain   = useColorModeValue('gray.50','gray.900');

  return (
    <div>
        <HStack spacing={4}>
          <IconButton aria-label="Menu" icon={<HamburgerIcon />} variant="ghost" />
          <Text fontSize="lg" fontWeight="bold">SafeContacts</Text>
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </HStack>
      <header style={{ padding: '1rem', borderBottom: '1px solid #eaeaea' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/">Home</Link>
          <Link href="/contacts">Contacts</Link>
          <Link href="/dialer">Dialer</Link>
          <Link href="/duplicates">Duplicates</Link>
          <Link href="/network">Network</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main style={{ padding: '1rem' }}>{children}</main>
      {/* Footer */}
      <Flex as="footer" bg={bgHeader} py={4} justify="center" borderTopWidth="1px" >
        <Text fontSize="sm" color="gray.500">
          © {new Date().getFullYear()} SafeContacts Inc.
        </Text>
      </Flex>
    </div>
  );
}
