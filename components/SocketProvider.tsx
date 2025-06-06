// Step 2: Update SocketProvider to use silent printing
// app/components/SocketProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import socket from '@/lib/socket';
import { useSilentPrinting } from '@/hooks/useSilentPrinting';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  attributes?: any;
}

interface OrderData {
  _id: string;
  userId: string;
  orders: OrderItem[];
  status: string;
  createdAt?: string;
}

export default function SocketProvider() {
  const [isConnected, setIsConnected] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const { printSilently } = useSilentPrinting();

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreference = localStorage.getItem('autoPrintEnabled');
    if (savedPreference !== null) {
      setAutoPrintEnabled(JSON.parse(savedPreference));
    }

    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);
      setIsConnected(true);
    });

    socket.on('newOrder', async (orderData: OrderData) => {
      console.log('📦 New Order Received:', orderData);
      
      // Show notification
      showNotification(orderData);
      
      // Auto-print if enabled
      if (autoPrintEnabled) {
        setPrintingStatus('printing');
        console.log('🖨️ Starting silent print...');
        
        try {
          const success = await printSilently(orderData);
          if (success) {
            setPrintingStatus('success');
            console.log('✅ Invoice printed silently');
          } else {
            setPrintingStatus('error');
            console.log('❌ Silent print failed');
          }
        } catch (error) {
          setPrintingStatus('error');
          console.error('❌ Silent printing error:', error);
        }
        
        // Reset status after 3 seconds
        setTimeout(() => setPrintingStatus('idle'), 3000);
      }
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('newOrder', { 
        detail: { orderData, printingStatus } 
      }));
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('newOrder');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [autoPrintEnabled, printSilently]);

  useEffect(() => {
    localStorage.setItem('autoPrintEnabled', JSON.stringify(autoPrintEnabled));
  }, [autoPrintEnabled]);

  const showNotification = (orderData: OrderData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🍽️ New Order - Printing...', {
        body: `Order #${orderData._id.slice(-8)} - ${orderData.orders.length} items`,
        icon: '/favicon.ico',
        tag: 'new-order'
      });

      setTimeout(() => notification.close(), 5000);
    }
  };

  // Global functions for debugging/control
  useEffect(() => {
    (window as any).toggleAutoPrint = () => {
      setAutoPrintEnabled(prev => !prev);
      console.log('Auto-print:', !autoPrintEnabled ? 'enabled' : 'disabled');
    };

    (window as any).getStatus = () => ({
      connected: isConnected,
      autoPrint: autoPrintEnabled,
      printing: printingStatus
    });

    (window as any).testPrint = async () => {
      const testOrder: OrderData = {
        _id: 'test-' + Date.now(),
        userId: 'test-user',
        status: 'pending',
        orders: [
          {
            productId: 'test-1',
            productName: 'Test Pizza',
            quantity: 1,
            price: 12.99,
            attributes: { size: 'Large', crust: 'Thin' }
          }
        ]
      };
      
      console.log('🧪 Testing silent print...');
      const success = await printSilently(testOrder);
      console.log('Test result:', success ? 'SUCCESS' : 'FAILED');
    };
  }, [isConnected, autoPrintEnabled, printingStatus, printSilently]);

  return null;
}