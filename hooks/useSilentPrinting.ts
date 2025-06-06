// hooks/useSilentPrinting.ts
export const useSilentPrinting = () => {
  const printSilently = async (orderData: any): Promise<boolean> => {
    return new Promise((resolve) => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      if (!printWindow) {
        console.error("❌ Couldn't open print window");
        return resolve(false);
      }

      const orderHTML = `
        <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Order Invoice</h1>
          <p><strong>Order ID:</strong> ${orderData._id}</p>
          <p><strong>Status:</strong> ${orderData.status}</p>
          <p><strong>Date:</strong> ${new Date(orderData.createdAt || Date.now()).toLocaleString()}</p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.orders.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      printWindow.document.write(orderHTML);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        resolve(true);
      };
    });
  };

  return { printSilently };
};
