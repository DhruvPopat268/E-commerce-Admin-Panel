// app/components/SocketProvider.tsx
'use client';

import { useEffect } from 'react';
import socket from '@/lib/socket';

export default function SocketProvider() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);
    });

    socket.on('newOrder', (orderData) => {
      console.log('📦 New Order Received:', orderData);
      // You can show toast or trigger printing here
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything visually
}
