import Link from 'next/link';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Simple layout component for the SafeContacts pages.
 * Provides a basic navigation bar and wraps children in a main container.
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #eaeaea' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/">Home</Link>
          <Link href="/dialer">Dialer</Link>
          <Link href="/duplicates">Duplicates</Link>
          <Link href="/graph">Network Graph</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}
