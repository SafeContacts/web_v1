// pages/_app.tsx
import { ChakraProvider } from '@chakra-ui/react';
import { theme }          from '../src/theme';
import Layout             from '../src/components/Layout';
import type { AppProps }  from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {

// initialize socket.io server endpoint
  useEffect(() => {
  	fetch('/api/socket');
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ChakraProvider>
  );

}

