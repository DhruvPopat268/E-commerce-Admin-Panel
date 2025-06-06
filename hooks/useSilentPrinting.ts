export const useSilentPrinting = () => {
  const printSilently = async (orderData: any): Promise<boolean> => {
    try {
      const printWindow = window.open(
        `/print?orderId=${orderData._id}`,
        '_blank',
        'width=800,height=600'
      );

      if (!printWindow) {
        console.error("❌ Couldn't open print window");
        return false;
      }

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      return true;
    } catch (error) {
      console.error("❌ Error printing silently:", error);
      return false;
    }
  };

  return { printSilently };
};
