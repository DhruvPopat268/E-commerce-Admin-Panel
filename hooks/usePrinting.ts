// app/hooks/usePrinting.ts
'use client';

import { useCallback } from 'react';

interface OrderItem {
  productId: string;
  productName: string;
  image?: string;
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

export const usePrinting = () => {
  // Method 1: Standard browser printing
  const printWithBrowser = useCallback((orderData: OrderData) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    const invoiceHTML = generateInvoiceHTML(orderData);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    };
  }, []);

  // Method 2: Silent printing (requires user interaction first)
  const printSilently = useCallback((orderData: OrderData) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '-9999px';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.write(generateInvoiceHTML(orderData));
      frameDoc.close();
      
      printFrame.onload = () => {
        printFrame.contentWindow?.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      };
    }
  }, []);

  // Method 3: Download as PDF (alternative approach)
  const downloadAsPDF = useCallback((orderData: OrderData) => {
    const invoiceHTML = generateInvoiceHTML(orderData);
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${orderData._id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Main printing function with fallbacks
  const printInvoice = useCallback(async (orderData: OrderData) => {
    try {
      // Try browser printing first
      printWithBrowser(orderData);
      console.log('✅ Invoice printed successfully');
    } catch (error) {
      console.warn('⚠️ Browser printing failed, trying silent print:', error);
      try {
        printSilently(orderData);
      } catch (silentError) {
        console.warn('⚠️ Silent printing failed, downloading instead:', silentError);
        downloadAsPDF(orderData);
      }
    }
  }, [printWithBrowser, printSilently, downloadAsPDF]);

  return { printInvoice };
};

// Enhanced invoice HTML generator
const generateInvoiceHTML = (orderData: OrderData): string => {
  const currentDate = new Date().toLocaleString();
  const orderDate = orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : currentDate;
  const totalAmount = orderData.orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - Order #${orderData._id}</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 10px;
          max-width: 300px;
          margin: 0 auto;
        }
        
        .receipt {
          width: 100%;
        }
        
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .company-info {
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        .order-section {
          margin-bottom: 15px;
        }
        
        .section-title {
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 8px;
        }
        
        .order-info {
          font-size: 11px;
        }
        
        .order-info div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .items {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
          margin: 15px 0;
        }
        
        .item {
          margin-bottom: 10px;
          font-size: 11px;
        }
        
        .item-name {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
        }
        
        .item-attributes {
          font-size: 9px;
          color: #666;
          font-style: italic;
          margin-top: 2px;
        }
        
        .totals {
          text-align: right;
          font-size: 12px;
        }
        
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .final-total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 8px;
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="company-name">Your Restaurant</div>
          <div class="company-info">123 Main Street</div>
          <div class="company-info">City, State 12345</div>
          <div class="company-info">Tel: (555) 123-4567</div>
        </div>
        
        <div class="order-section">
          <div class="section-title">ORDER DETAILS</div>
          <div class="order-info">
            <div><span>Order ID:</span><span>#${orderData._id.slice(-8)}</span></div>
            <div><span>Date:</span><span>${orderDate}</span></div>
            <div><span>Status:</span><span>${orderData.status.toUpperCase()}</span></div>
            <div><span>Customer:</span><span>${orderData.userId.slice(-8)}</span></div>
          </div>
        </div>
        
        <div class="items">
          <div class="section-title">ITEMS ORDERED</div>
          ${orderData.orders.map(item => `
            <div class="item">
              <div class="item-name">${item.productName}</div>
              <div class="item-details">
                <span>${item.quantity} x $${item.price.toFixed(2)}</span>
                <span>$${(item.quantity * item.price).toFixed(2)}</span>
              </div>
              ${item.attributes ? `
                <div class="item-attributes">
                  ${Object.entries(item.attributes).map(([key, value]) => 
                    `${key}: ${value}`).join(', ')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>$${totalAmount.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>Tax:</span>
            <span>$0.00</span>
          </div>
          <div class="total-line final-total">
            <span>TOTAL:</span>
            <span>$${totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>Thank you for your order!</div>
          <div>Please keep this receipt</div>
          <div>Printed: ${currentDate}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};