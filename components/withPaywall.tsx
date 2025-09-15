// components/withPaywall.tsx
import React, { useEffect, useState } from 'react';
import PaywallOverlay from './PaywallOverlay';

export default function withPaywall<T>(Wrapped: React.ComponentType<T>) {
  return (props: T) => {
    const [subscribed, setSubscribed] = useState(false);
    useEffect(() => {
      setSubscribed(localStorage.getItem('subscribed') === 'true');
    }, []);
    if (!subscribed) return <PaywallOverlay />;
    return <Wrapped {...props} />;
  };
}

