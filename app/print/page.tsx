'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Separate component that uses useSearchParams
function PrintContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/printer/${orderId}`);
        
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [order]);

  if (!order) return <div>Loading invoice...</div>;

  const { orders = [], orderDate, status, _id } = order;

  const grandTotal = orders.reduce((acc: number, item: any) => acc + (item.attributes?.total || 0), 0);

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Your Company Name</h1>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>INVOICE</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> {_id}</p>
        <p><strong>Order Date:</strong> {new Date(orderDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Invoice Date:</strong> {new Date().toLocaleDateString()}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={tdStyle}>#</th>
            <th style={tdStyle}>Item</th>
            <th style={tdStyle}>Attribute</th>
            <th style={tdStyle}>Price</th>
            <th style={tdStyle}>Qty</th>
            <th style={tdStyle}>Discounted</th>
            <th style={tdStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((item: any, index: number) => (
            <tr key={item._id}>
              <td style={tdStyle}>{index + 1}</td>
              <td style={tdStyle}>{item.productName}</td>
              <td style={tdStyle}>{item.attributes?.name || '-'}</td>
              <td style={tdStyle}>₹{item.attributes?.discountedPrice || item.price}</td>
              <td style={tdStyle}>{item.attributes?.quantity || item.quantity}</td>
              <td style={tdStyle}>₹{item.attributes?.discountedPrice || '-'}</td>
              <td style={tdStyle}>₹{item.attributes?.total || (item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ textAlign: 'right', marginTop: '20px' }}>Grand Total: ₹{grandTotal.toLocaleString()}</h3>

      <p style={{ marginTop: '40px', textAlign: 'center' }}>Thank you for your business!</p>
      <p style={{ fontSize: '12px', textAlign: 'center' }}><em>This is a computer generated invoice.</em></p>
    </div>
  );
}

// Main component with Suspense boundary
export default function PrintPage() {
  return (
    <Suspense fallback={<div>Loading invoice...</div>}>
      <PrintContent />
    </Suspense>
  );
}

const tdStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left' as const,
};