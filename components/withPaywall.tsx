// components/withPaywall.tsx
import React, { useEffect, useState } from 'react';
import PaywallOverlay from './PaywallOverlay';

export default function withPaywall<P extends object>(Wrapped: React.ComponentType<P>) {
  return function Paywalled(props: P) {
    const [subscribed, setSubscribed] = useState(false);
    useEffect(() => {
      setSubscribed(localStorage.getItem('subscribed') === 'true');
    }, []);
    if (!subscribed) return <PaywallOverlay />;
    return <Wrapped {...(props as P)} />;
  };
}

