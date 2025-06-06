export const useSilentPrinting = () => {
  const printSilently = async (orderData: any): Promise<boolean> => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `/print?orderId=${orderData._id}`;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 5000); // Cleanup
      };

      return true;
    } catch (error) {
      console.error("❌ Error printing silently:", error);
      return false;
    }
  };

  return { printSilently };
};
