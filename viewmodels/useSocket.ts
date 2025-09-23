import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useSocket(userId: string) {
  const socketRef = useRef<Socket|null>(null);

  useEffect(() => {

   const socket = io(window.location.origin, {
     path: '/api/socket',
     transports: ['websocket'],
     query: { userId }
   });
   socketRef.current = socket;
   return () => {
     if (socketRef.current && typeof socketRef.current.disconnect === 'function') {
       socketRef.current.disconnect();
     }
   };

  }, [userId]);

  return socketRef.current!;
}

