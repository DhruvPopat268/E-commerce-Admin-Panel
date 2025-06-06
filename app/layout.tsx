// app/layout.tsx

'use client';

import type { Metadata } from 'next';
import './globals.css';
import { useEffect } from 'react';
import socket from '@/lib/socket'; // adjust path if needed

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);
    });

    socket.on('newOrder', (orderData) => {
      console.log('📦 New order received:', orderData);

      // Show toast or trigger print here
      // window.open(`/print/invoice?id=${orderData._id}`, '_blank');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
