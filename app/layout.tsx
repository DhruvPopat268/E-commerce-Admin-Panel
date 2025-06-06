// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import SocketProvider from '../components/SocketProvider'; // path might change based on structure

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
  return (
    <html lang="en">
      <body>
        <SocketProvider />
        {children}
      </body>
    </html>
  );
}
