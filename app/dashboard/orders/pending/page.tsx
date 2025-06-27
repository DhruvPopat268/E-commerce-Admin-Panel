"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Calendar, Eye, Printer, Download, Clock, Check, Loader2, X, FileText, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"


// Mock toast function - replace with your actual toast implementation
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message)
}

interface Order {
  _id: string
  userId: string
  orders: Array<{
    productId: string
    productName: string
    image: string
    attributes: {
      _id: string
      name: string
      discountedPrice: number
      quantity: number
      total: number
    }
    _id: string
  }>
  status: string
  orderDate: string
  __v: number
  cartTotal?: number
  salesAgentName?: string
  salesAgentMobile?: string
  villageName?: string
  routeName?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalOrders: number  // Change from pendingOrders to totalOrders
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
}

export default function PendingOrdersPage() {
  const router = useRouter()

  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [confirmingOrders, setConfirmingOrders] = useState(false)
  const [cancellingOrders, setCancellingOrders] = useState(false)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [bulkPrinting, setBulkPrinting] = useState(false)

  const recordsPerPageOptions = [5, 10, 25, 50, 100]

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0, // Change from pendingOrders to totalOrders
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
    startIndex: 1,
    endIndex: 10
  })
  const [recordsPerPage, setRecordsPerPage] = useState(10)

  useEffect(() => {
    setIsMounted(true)
    if (isMounted) {
      fetchPendingOrders()
    }
  }, [pagination.currentPage, recordsPerPage, isMounted])

  // Update selectAll state when selectedOrders changes
  useEffect(() => {
    if (pendingOrders.length > 0) {
      setSelectAll(selectedOrders.size === pendingOrders.length)
    }
  }, [selectedOrders, pendingOrders])



  const fetchPendingOrders = async () => {
    try {
      setLoading(true) // Make sure this is at the beginning
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/all?status=pending&page=${pagination.currentPage}&limit=${recordsPerPage}`
      )
      const data = await response.json()

      console.log(data)

      if (data.orders) {
        setPendingOrders(data.orders)
        console.log(data.orders)
        setSelectedOrders(new Set())

        setPagination({
          ...data.pagination,
          totalOrders: data.pagination.totalOrders
        })
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      toast.error('Failed to fetch pending orders')
    } finally {
      setLoading(false) // Only set loading to false here
    }
  }

  //   const generateInvoiceHTML = (order: Order) => {
  //     const orderTotal = order.cartTotal || calculateCartTotal(order.orders)
  //     const currentDate = new Date().toLocaleDateString('en-GB', {
  //       day: '2-digit',
  //       month: 'short',
  //       year: 'numeric'
  //     })

  //     return `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //         <meta charset="utf-8">
  //         <title>Invoice - ${order._id.slice(-6).toUpperCase()}</title>
  //         <style>
  //             body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
  //             .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #teal; padding-bottom: 20px; }
  //             .company-name { font-size: 28px; font-weight: bold; color: #14b8a6; margin-bottom: 5px; }
  //             .invoice-title { font-size: 24px; color: #666; }
  //             .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
  //             .info-section { flex: 1; }
  //             .info-section h3 { color: #14b8a6; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
  //             .order-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  //             .order-table th, .order-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
  //             .order-table th { background-color: #f8fafc; font-weight: bold; color: #374151; }
  //             .total-section { text-align: right; margin-top: 20px; }
  //             .total-row { display: flex; justify-content: flex-end; margin-bottom: 10px; }
  //             .total-label { font-weight: bold; margin-right: 20px; min-width: 120px; }
  //             .total-amount { font-weight: bold; min-width: 100px; }
  //             .grand-total { font-size: 18px; color: #14b8a6; border-top: 2px solid #14b8a6; padding-top: 10px; }
  //             .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  //             @media print { body { margin: 0; } }
  //         </style>
  //     </head>
  //     <body>
  //        <div class="invoice-header" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
  //   <img src="${window.location.origin}/zoya_traders.png" alt="Zoya Traders Logo" style="height: 30px;" />
  //   <div style="font-size: 24px; font-weight: bold; color: #1abc9c;">Zoya Traders</div>
  // </div>
  // <div class="invoice-title" style="text-align: center; font-size: 18px; color: #555; margin-bottom: 20px;">INVOICE</div>


  //         <div class="invoice-info">
  //             <div class="info-section">
  //                 <h3>Order Details</h3>
  //                 <p><strong>Order ID:</strong> ${order._id.slice(-6).toUpperCase()}</p>
  //                 <p><strong>Order Date:</strong> ${formatDate(order.orderDate)}</p>
  //                 <p><strong>Status:</strong> ${order.status}</p>
  //                 <p><strong>Invoice Date:</strong> ${currentDate}</p>
  //             </div>

  //             <div class="info-section">
  //                 <h3>Customer Details</h3>
  //                 <p><strong>Sales Agent:</strong> ${order.salesAgentName || 'N/A'}</p>
  //                 <p><strong>Mobile:</strong> ${order.salesAgentMobile || 'N/A'}</p>
  //                 <p><strong>Village:</strong> ${order.villageName || 'N/A'}</p>
  //                 <p><strong>Route:</strong> ${order.routeName || 'N/A'}</p>
  //             </div>
  //         </div>

  //         <table class="order-table">
  //             <thead>
  //                 <tr>
  //                     <th>SL</th>
  //                     <th>Item Details</th>
  //                     <th>Attribute</th>
  //                     <th>Price</th>
  //                     <th>Quantity</th>
  //                     <th>Discount Price</th>
  //                     <th>Total Price</th>
  //                 </tr>
  //             </thead>
  //             <tbody>
  //                 ${order.orders.map((item, index) => `
  //                     <tr>
  //                         <td>${index + 1}</td>
  //                         <td>${item.productName}</td>
  //                         <td>${item.attributes.name}</td>
  //                         <td>₹${item.attributes.discountedPrice}</td>
  //                         <td>${item.attributes.quantity}</td>
  //                         <td>₹${item.attributes.discountedPrice}</td>
  //                         <td>₹${item.attributes.total}</td>
  //                     </tr>
  //                 `).join('')}
  //             </tbody>
  //         </table>

  //         <div class="total-section">
  //             <div class="total-row grand-total">
  //                 <div class="total-label">Grand Total:</div>
  //                 <div class="total-amount">₹${orderTotal.toLocaleString()}</div>
  //             </div>
  //         </div>

  //         <div class="footer">
  //             <p>Thank you for your business!</p>
  //             <p>This is a computer generated invoice.</p>
  //         </div>
  //     </body>
  //     </html>
  //     `
  //   }

  const printSingleInvoice = async (order: Order) => {
    try {
      setGeneratingInvoice(true)

      const invoiceHTML = generateInvoiceHTML(order)

      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(invoiceHTML)
        printWindow.document.close()

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)

        toast.success('Invoice generated successfully!')
      } else {
        toast.error('Unable to open print window. Please check popup settings.')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Failed to generate invoice')
    } finally {
      setGeneratingInvoice(false)
    }
  }

  const printBulkInvoices = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to print')
      return
    }

    try {
      setBulkPrinting(true)

      const selectedOrdersData = pendingOrders.filter(order => selectedOrders.has(order._id))



      // Generate combined HTML for all selected orders
     const combinedHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Bulk Invoices</title>
          <style>
              <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&display=swap" rel="stylesheet">

              @page {
                size: A4;
                margin: 0;
              }

              body {
                font-family: 'Noto Sans Gujarati', Arial, sans-serif;
                font-size: 22px;
                margin: 0;
                padding: 0;
              }

              .invoice-container {
                width: 100mm;
                height: 140mm;
                padding: 8mm;
                box-sizing: border-box;
                page-break-inside: avoid;
              }

              .page-break { 
                page-break-after: always; 
              }

              .invoice-header {
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #14b8a6;
                padding-bottom: 10px;
              }

              .header-content {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 5px;
              }

              .company-logo {
                width: 40px;
                height: 40px;
                margin-right: 10px;
                object-fit: contain;
              }

              .company-name {
                font-size: 25px;
                font-weight: bold;
                color: #14b8a6;
                margin: 0;
              }

              .invoice-title {
                font-size: 17px;
                color: #666;
              }

              .invoice-info {
                margin-bottom: 15px;
              }

              .info-section {
                margin-bottom: 10px;
              }

              .info-section h3 {
                color: #14b8a6;
                font-size: 20px;
                margin: 0 0 5px;
                border-bottom: 1px solid #e5e7eb;
              }

              .info-section p {
                margin: 2px 0;
                font-size: 15px;
              }

              .order-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }

              .order-table th, .order-table td {
                border: 1px solid #e5e7eb;
                padding: 4px;
                text-align: left;
                font-size: 11px;
              }

              .order-table th {
                background-color: #f8fafc;
                font-weight: bold;
                color: #374151;
              }

              .gujarati-text {
                font-family: 'Noto Sans Gujarati', Arial, sans-serif;
                font-size: 15px;
              }

              .total-section {
                text-align: right;
                margin-top: 10px;
              }

              .invoice-info-compact {
                margin-bottom: 10px;
                font-size: 12px;
                line-height: 1.4;
              }

              .invoice-info-compact p {
                margin: 2px 0;
              }

              .total-row {
                display: flex;
                justify-content: flex-end;
              }

              .total-label {
                font-weight: bold;
                margin-right: 10px;
                font-size: 15px;
              }

              .total-amount {
                font-weight: bold;
                font-size: 15px;
                color: #14b8a6;
              }

              @media print {
                body {
                  margin: 0;
                }
              }
          </style>
      </head>
      <body>
          ${selectedOrdersData.map((order, index) => {
        const orderTotal = order.cartTotal || calculateCartTotal(order.orders)
        const currentDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })

        return `
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="header-content">
                        <img src="${window.location.origin}/zoya_traders.png" alt="Zoya Traders Logo" class="company-logo" onerror="this.style.display='none'" />
                        <div class="company-name">Zoya Traders</div>
                    </div>
                    <div class="invoice-title">INVOICE</div>
                </div>

                <div class="invoice-info-compact">
                    <p>${order.salesAgentName || 'N/A'} | ${order.villageName || order.village || order.villageCode || 'N/A'} | ${order.salesAgentMobile || 'N/A'} | ${formatDate(order.orderDate)} </p>
                </div>

                <table class="order-table">
                    <thead>
                        <tr>
                            <th style="width: 8%;">SL</th>
                            <th style="width: 52%;">Item Details</th>
                            <th style="width: 12%;">Quantity</th>
                            <th style="width: 14%;">Price</th>
                            <th style="width: 14%;">Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.orders.map((item, itemIndex) => `
                            <tr>
                                <td>${itemIndex + 1}</td>
                                <td class="gujarati-text">${item.productName || 'N/A'}</td>
                                <td>${item.attributes?.quantity || 0}</td>
                                <td>₹${item.attributes?.discountedPrice || 0}</td>
                                <td>₹${item.attributes?.total || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-row">
                        <div class="total-label">Grand Total:</div>
                        <div class="total-amount">₹${orderTotal.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            ${index < selectedOrdersData.length - 1 ? '<div class="page-break"></div>' : ''}
            `
      }).join('')}
      </body>
      </html>
      `

      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(combinedHTML)
        printWindow.document.close()

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 1000)

        toast.success(`${selectedOrders.size} invoices generated successfully!`)
      } else {
        toast.error('Unable to open print window. Please check popup settings.')
      }
    } catch (error) {
      console.error('Error generating bulk invoices:', error)
      toast.error('Failed to generate invoices')
    } finally {
      setBulkPrinting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedOrders(new Set(pendingOrders.map(order => order._id)))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/order-details/${orderId}`)

  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelectedOrders = new Set(selectedOrders)
    if (checked) {
      newSelectedOrders.add(orderId)
    } else {
      newSelectedOrders.delete(orderId)
    }
    setSelectedOrders(newSelectedOrders)
  }

  const confirmSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to confirm')
      return
    }

    try {
      setConfirmingOrders(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/confirm-bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      })

      const data = await response.json()

      if (response.ok) {
        // Generate report before clearing the selection
        await generateOrderReport(Array.from(selectedOrders));

        setPendingOrders(prev => prev.filter(order => !selectedOrders.has(order._id)))
        setSelectedOrders(new Set())
        setSelectAll(false)
        toast.success(`${selectedOrders.size} order(s) confirmed successfully!`)
      } else {
        toast.error(data.message || 'Failed to confirm orders')
      }
    } catch (error) {
      console.error('Error confirming orders:', error)
      toast.error('Failed to confirm orders')
    } finally {
      setConfirmingOrders(false)
    }
  }

  // PDF Generation function
  const generateOrderReport = async (orderIds) => {
    try {
      // Fetch the selected orders data (you might already have this in state)
      const selectedOrdersData = pendingOrders.filter(order => orderIds.includes(order._id));

      // Create a new window with the report template
      const reportWindow = window.open('', '_blank');

      // Generate the HTML content
      const htmlContent = generateReportHTML(selectedOrdersData);

      // Write the content to the new window
      reportWindow.document.write(htmlContent);
      reportWindow.document.close();

      // Wait a bit for the content to load before printing
      setTimeout(() => {
        reportWindow.print();
        // reportWindow.close(); // Uncomment this if you want to auto-close after printing
      }, 500);

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  // Function to generate HTML for the report
  const generateReportHTML = (orders) => {
    // Split orders into two columns
    const midPoint = Math.ceil(orders.length / 2);
    const leftColumnOrders = orders.slice(0, midPoint);
    const rightColumnOrders = orders.slice(midPoint);

    // Calculate totals
    const leftTotal = leftColumnOrders.reduce((sum, order) => sum + order.cartTotal, 0);
    const rightTotal = rightColumnOrders.reduce((sum, order) => sum + order.cartTotal, 0);
    const grandTotal = orders.reduce((sum, order) => sum + order.cartTotal, 0);

    const generateTableRows = (orderList) => {
      return orderList.map(order => `
    <tr>
      <td>${order.villageCode}</td>
      <td>${order.salesAgentName}</td>
      <td>₹${order.cartTotal.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .report-title {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .report-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .columns-container {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .column {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 6px;
      text-align: left;
      font-size: 11px;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .grand-total {
      margin-top: 20px;
      text-align: center;
      padding: 10px;
      background-color: #e6f3ff;
      border: 2px solid #0066cc;
      font-weight: bold;
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-style: italic;
      color: #666;
      font-size: 10px;
    }
    @media print {
      body {
        margin: 0;
        padding: 10px;
        font-size: 10px;
      }
      .header {
        margin-bottom: 15px;
      }
      .company-name {
        font-size: 20px;
      }
      .report-title {
        font-size: 16px;
      }
      .columns-container {
        gap: 15px;
      }
      th, td {
        padding: 4px;
        font-size: 9px;
      }
      .grand-total {
        font-size: 12px;
        margin-top: 15px;
      }
      button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Your Company Name</div>
    <div class="report-title">Order Confirmation Report</div>
  </div>
  
  <div class="report-info">
    <div>Date: ${new Date().toLocaleDateString()}</div>
    <div>Total Orders: ${orders.length}</div>
  </div>
  
  <div class="columns-container">
    <div class="column">
      <table>
        <thead>
          <tr>
            <th>Village Code</th>
            <th>Customer Name</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows(leftColumnOrders)}
          <tr class="total-row">
            <td colspan="2">Subtotal</td>
            <td>₹${leftTotal.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    ${rightColumnOrders.length > 0 ? `
    <div class="column">
      <table>
        <thead>
          <tr>
            <th>Village Code</th>
            <th>Customer Name</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows(rightColumnOrders)}
          <tr class="total-row">
            <td colspan="2">Subtotal</td>
            <td>₹${rightTotal.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>
  
  <div class="grand-total">
    Grand Total: ₹${grandTotal.toLocaleString('en-IN')}
  </div>
  
  <div class="footer">
    <p>This report contains all confirmed orders as of ${new Date().toLocaleDateString()}</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
`;
  };

  const cancelSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to cancel')
      return
    }

    try {
      setCancellingOrders(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/cancel-bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      })

      const data = await response.json()

      if (response.ok) {
        setPendingOrders(prev => prev.filter(order => !selectedOrders.has(order._id)))
        setSelectedOrders(new Set())
        setSelectAll(false)
        toast.success(`${selectedOrders.size} order(s) cancelled successfully!`)
      } else {
        toast.error(data.message || 'Failed to cancel orders')
      }
    } catch (error) {
      console.error('Error cancelling orders:', error)
      toast.error('Failed to cancel orders')
    } finally {
      setCancellingOrders(false)
    }
  }

  const calculateCartTotal = (orderItems: Order['orders']) => {
    return orderItems.reduce((total, item) => total + item.attributes.total, 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };



  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
  }


  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  const handleRecordsPerPageChange = (value: string) => {
    const newLimit = parseInt(value)
    setRecordsPerPage(newLimit)
    setPagination(prev => ({ ...prev, currentPage: 1, limit: newLimit }))
  }

  const generatePageNumbers = () => {
    const pages = []
    const { currentPage, totalPages } = pagination
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handleSearch = () => {
    console.log('Searching for:', searchTerm)
  }

  const handleShowData = () => {
    console.log('Filtering from:', startDate, 'to:', endDate)
  }

  const exportToCSV = () => {
    const csvContent = pendingOrders.map((order, index) => {
      return [
        index + 1,
        order._id.slice(-6).toUpperCase(),
        formatDate(order.orderDate),
        order.userId.slice(-8).toUpperCase(),
        calculateCartTotal(order.orders),
        order.status
      ].join(',')
    })

    const header = 'SL,Order ID,Order Date,Customer,Total Amount,Status\n'
    const csv = header + csvContent.join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pending-orders.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          {pagination.totalOrders} Total
        </Badge>

      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Select Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="relative">
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <div className="relative">
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                Clear
              </button>
              <button
                onClick={handleShowData}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Show Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <input
            placeholder="Ex : Search by ID, order or payment status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="recordsPerPage" className="whitespace-nowrap">Show:</Label>
            <Select value={recordsPerPage.toString()} onValueChange={handleRecordsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recordsPerPageOptions.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          <button
            onClick={printBulkInvoices}
            disabled={selectedOrders.size === 0 || bulkPrinting}
            className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${selectedOrders.size === 0 || bulkPrinting
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {bulkPrinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                Printing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2 inline" />
                Print ({selectedOrders.size})
              </>
            )}
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border border-teal-600 text-teal-600 rounded-md bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {pendingOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({pendingOrders.length} orders)
                  </label>
                </div>
                {selectedOrders.size > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedOrders.size} selected
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelSelectedOrders}
                  disabled={selectedOrders.size === 0 || cancellingOrders}
                  className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${selectedOrders.size === 0 || cancellingOrders
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {cancellingOrders ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2 inline" />
                      Cancel Selected ({selectedOrders.size})
                    </>
                  )}
                </button>
                <button
                  onClick={confirmSelectedOrders}
                  disabled={selectedOrders.size === 0 || confirmingOrders}
                  className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${selectedOrders.size === 0 || confirmingOrders
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {confirmingOrders ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2 inline" />
                      Confirm Selected ({selectedOrders.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading pending orders...</div>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-4 w-12">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="text-left p-4">SL</th>
                    <th className="text-left p-4">Order ID</th>
                    <th className="text-left p-4">Order Date</th>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Total Amount</th>
                    <th className="text-left p-4">Order Status</th>
                    <th className="text-left p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        No pending orders found
                      </td>
                    </tr>
                  ) : (
                    pendingOrders.map((order, index) => (
                      <tr key={order._id} className="hover:bg-gray-50 border-b">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order._id)}
                            onChange={(e) => handleSelectOrder(order._id, e.target.checked)}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-4">{pagination.startIndex + index}</td>
                        <td className="p-4 font-medium text-blue-600">
                          {order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-4">{formatDate(order.orderDate)}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-800">{order.salesAgentName || "N/A"}</div>
                          <div className="text-sm text-gray-500">{order.salesAgentMobile || "-"}</div>
                          <div className="font-medium text-gray-800">{order.villageName || "N/A"}</div>
                          <div className="text-sm text-gray-500">{order.routeName || "-"}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">
                            ₹{(order.cartTotal || calculateCartTotal(order.orders)).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrder(order._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalOrders} entries
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex gap-1">
                        {generatePageNumbers().map((page, index) => (
                          <Button
                            key={index}
                            variant={page === pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                            className="h-8 min-w-8 px-2"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="h-8 px-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  )
}