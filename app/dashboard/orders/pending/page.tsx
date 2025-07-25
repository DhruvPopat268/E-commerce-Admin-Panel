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

  const toGujaratiDigits = (number: number | string): string => {
    const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
    return number.toString().split('').map(char => {
      return /\d/.test(char) ? gujaratiDigits[parseInt(char)] : char;
    }).join('');
  };

  const printBulkInvoices = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to print')
      return
    }

    try {
      setBulkPrinting(true)

      const selectedOrdersData = pendingOrders.filter(order => selectedOrders.has(order._id))

      // Configuration constants
      const ITEMS_PER_PAGE = 9;
      const INVOICE_WIDTH = '10.5cm';
      const INVOICE_HEIGHT = '14cm';

      // Helper function to convert numbers to Gujarati digits
      const toGujaratiDigits = (num) => {
        const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
        return num.toString().replace(/[0-9]/g, (digit) => gujaratiDigits[parseInt(digit)]);
      };

      // Function to format date with time
      const formatDateWithTime = (dateString) => {
        if (!dateString) return { date: '16/07/2025', time: '10:30 AM' };

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return {
          date: `${toGujaratiDigits(day)}/${toGujaratiDigits(month)}/${toGujaratiDigits(year)}`,
          time: `${toGujaratiDigits(hours)}:${toGujaratiDigits(minutes)} ${ampm}`
        };
      };

      // Function to create invoice header
      const createInvoiceHeader = (order, isFirstPage = true, pageNumber = 1, totalPages = 1) => {
        const dateTime = formatDateWithTime(order.orderDate);
        return `
        <div class="invoice-header">
          <div class="header-content">
            <img src="${window.location.origin}/zoya_traders.png" alt="Zoya Traders Logo" class="company-logo" onerror="this.style.display='none'" />
            <div class="company-name">Zoya Traders</div>
          </div>
          <div class="invoice-title">ESTIMATE${!isFirstPage ? ' (Continued)' : ''}</div>
          ${!isFirstPage ? `<div class="page-info">Page ${pageNumber} of ${totalPages}</div>` : ''}
        </div>

        <div class="invoice-details">
          <div class="customer-info">
            <div class="customer-label">M/s. :</div>
            <div class="customer-details">
              <div class="customer-name">${order.salesAgentName || order.customerName || 'વિપુલભાઈ ગોધાવરા'}</div>
              <div class="customer-contact">${order.salesAgentMobile || order.customerMobile || '6320344507'}</div>
            </div>
            <div class="order-date">
              <div class="date-line">${dateTime.date}</div>
              <div class="time-line">${dateTime.time}</div>
            </div>
          </div>
            
          <div class="order-details-section">
            <div class="order-details-row">
              <div class="detail-item">
                <span class="detail-label">Village:</span>
                <span class="detail-value">${order.villageName || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Type:</span>
                <span class="detail-value">
                  ${order.orderType === 'take-away' ? 'લઈ જવું' : 'મોકલવુ'}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
      };

      // Function to create table header
      const createTableHeader = () => {
        return `
        <div class="invoice-table">
          <div class="table-header">
            <div class="col-sr">ક્રમ</div>
            <div class="col-item">આઇટમ</div>
            <div class="col-qty">જથ્થો</div>
            <div class="col-rate">કિંમત</div>
            <div class="col-total">કુલ</div>
          </div>
          <div class="table-body">
      `;
      };

      // Function to create empty rows to fill remaining space
      const createEmptyRows = (count) => {
        return Array.from({ length: count }, (_, i) => `
        <div class="table-row empty-row">
          <div class="col-sr">&nbsp;</div>
          <div class="col-item">&nbsp;</div>
          <div class="col-qty">&nbsp;</div>
          <div class="col-rate">&nbsp;</div>
          <div class="col-total">&nbsp;</div>
        </div>
      `).join('');
      };

      // Function to close table
      const closeTable = () => {
        return `
          </div>
        </div>
      `;
      };

      // Generate combined HTML for all selected orders
      const combinedHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bulk Estimates - Zoya Traders</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&display=swap');

        @page {
          size: A4;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Noto Sans Gujarati', Arial, sans-serif;
          font-size: 12px;
          margin: 0;
          padding: 0;
          line-height: 1.2;
          background: white;
          color: #222;
        }

        .invoice-container {
          width: ${INVOICE_WIDTH};
          height: ${INVOICE_HEIGHT};
          padding: 6mm;
          page-break-inside: avoid;
          background: white;
          position: relative;
          margin: 0;
          float: left;
          border: 1px solid #bbb;
        }

        .page-break { 
          page-break-after: always; 
          clear: both;
        }

        .invoice-header {
          text-align: center;
          margin-bottom: 8px;
          border-bottom: 1px solid #bbb;
          padding-bottom: 5px;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 3px;
        }

        .company-logo {
          width: 25px;
          height: 25px;
          margin-right: 6px;
          object-fit: contain;
        }

        .company-name {
          font-size: 16px;
          font-weight: 400;
          color: #222;
          margin: 0;
        }

        .invoice-title {
          font-size: 15px;
          font-weight: 400;
          color: #222;
          text-decoration: underline;
          margin: 3px 0;
        }

        .page-info {
          font-size: 10px;
          color: #888;
          margin-top: 3px;
        }

        .invoice-details {
          margin-bottom: 8px;
          border: 1px solid #bbb;
          padding: 5px;
        }

        .customer-info {
          display: flex;
          align-items: flex-start;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #bbb;
        }

        .customer-label {
          font-weight: 400;
          margin-right: 5px;
          white-space: nowrap;
          font-size: 14px;
          min-width: 25px;
        }

        .customer-details {
          flex: 1;
          margin-right: 8px;
        }

        .customer-name {
          font-weight: 400;
          font-size: 14px;
          margin-bottom: 2px;
          line-height: 1.1;
        }

        .customer-contact {
          font-size: 13px;
          font-weight: 400;
          color: #222;
        }

        .order-date {
          text-align: right;
          font-size: 10px;
          white-space: nowrap;
          font-weight: 400;
          min-width: 80px;
        }

        .date-line {
          margin-bottom: 2px;
        }

        .time-line {
          font-size: 11px;
        }

        .order-details-section {
          margin-top: 4px;
        }

        .order-details-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          gap: 5px;
        }

        .detail-item {
          flex: 1;
          display: flex;
          align-items: center;
          font-size: 10px;
          min-height: 15px;
        }

        .detail-label {
          font-weight: 400;
          margin-right: 3px;
          min-width: 35px;
          color: #222;
        }

        .detail-value {
          font-weight: 400;
          color: #333;
          word-break: break-word;
          font-size: 13px;
        }

        .invoice-table {
          width: 100%;
          border: 1px solid #bbb;
          margin-bottom: 6px;
          border-collapse: collapse;
          display: table;
        }

        .table-header {
          display: table-row;
          background-color: #fafafa;
          border-bottom: 1px solid #bbb;
          font-weight: 400;
          font-size: 20px;
          text-align: center;
          height: 30px;
          align-items: center;
        }

        .table-body {
          min-height: 180px;
          display: table-row-group;
        }

        .table-row {
          display: table-row;
          border-bottom: 1px solid #bbb;
          min-height: 30px;
          align-items: center;
          font-size: 20px;
          font-weight: 400;
        }

        .table-row:last-child {
          border-bottom: 1px solid #bbb;
        }

        .empty-row {
          border-bottom: 1px solid #bbb !important;
        }

        .col-sr, .col-item, .col-qty, .col-rate, .col-total {
          border-right: 1px solid #bbb;
          border-bottom: 1px solid #bbb;
          border-top: none;
          border-left: none;
          padding: 3px 2px;
          text-align: center;
          display: table-cell;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          min-height: 24px;
          font-weight: 400;
        }
        .col-item {
          padding: 3px 4px;
          width: 38%;
        }
        .col-sr { width: 12%; }
        .col-qty { width: 15%; }
        .col-rate { width: 17%; }
        .col-total {
          width: 18%;
          border-right: none;
        }

        .table-header .col-sr,
        .table-header .col-item,
        .table-header .col-qty,
        .table-header .col-rate {
          border-right: 1px solid #bbb;
          border-top: none;
          border-bottom: none;
        }

        .table-header .col-total {
          border-right: none;
          border-top: none;
          border-bottom: none;
        }

        .table-row .col-sr,
        .table-row .col-item,
        .table-row .col-qty,
        .table-row .col-rate {
          border-right: 1px solid #bbb;
          border-top: none;
          border-bottom: none;
        }

        .table-row .col-total {
          border-right: none;
          border-top: none;
          border-bottom: none;
        }

        .gujarati-text {
          font-family: 'Noto Sans Gujarati', Arial, sans-serif;
          font-size: 15px;
        }

        .total-section {
          margin-top: 6px;
          padding: 5px;
          border: 1px solid #bbb;
          background-color: #fafafa;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 400;
          font-size: 13px;
          padding: 3px 0;
          border-top: 1px solid #bbb;
          margin-top: 5px;
          padding-top: 5px;
        }

        .grand-total-label {
          font-size: 12px;
        }

        .grand-total-amount {
          font-size: 17px;
          font-weight: 400;
        }

        .continuation-notice {
          text-align: center;
          font-style: italic;
          color: #888;
          margin-top: 5px;
          font-size: 10px;
          padding: 3px;
          border: 1px solid #eee;
          background-color: #fafafa;
        }

        .subtotal-section {
          margin-top: 6px;
          padding: 3px;
          border: 1px solid #bbb;
          background-color: #fafafa;
        }

        .subtotal-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .subtotal-label {
          font-weight: 400;
          color: #888;
        }

        .subtotal-amount {
          font-weight: 400;
          color: #222;
        }

        @media print {
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-container {
            border: none;
            float: left;
            margin: 0;
            padding: 6mm;
          }
          .invoice-table {
            border: 1px solid #bbb !important;
          }
          .table-header {
            background-color: #fafafa !important;
            border-bottom: 1px solid #bbb !important;
          }
          .table-row {
            border-bottom: 1px solid #bbb !important;
          }
          .table-row:last-child {
            border-bottom: 1px solid #bbb !important;
          }
          .empty-row {
            border-bottom: 1px solid #bbb !important;
          }
          .col-sr, .col-item, .col-qty, .col-rate, .col-total {
            border-right: 1px solid #bbb !important;
            border-bottom: 1px solid #bbb !important;
          }
          .col-total {
            border-right: none !important;
          }
          .invoice-details {
            border: 1px solid #bbb !important;
          }
          .customer-info {
            border-bottom: 1px solid #bbb !important;
          }
        }
    </style>
</head>
<body>
    ${selectedOrdersData.map((order, orderIndex) => {
        const orderTotal = order.cartTotal || calculateCartTotal(order.orders);
        const items = order.orders || [];
        const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

        let orderHTML = '';

        // Generate pages for each order
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
          const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
          const pageItems = items.slice(startIndex, endIndex);
          const isFirstPage = pageNum === 1;
          const isLastPage = pageNum === totalPages;

          // Calculate subtotal for current page
          const pageSubtotal = pageItems.reduce((sum, item) => sum + (item.attributes?.total || 0), 0);

          orderHTML += `
          <div class="invoice-container">
            ${createInvoiceHeader(order, isFirstPage, pageNum, totalPages)}
            
            ${createTableHeader()}
            
            ${pageItems.map((item, itemIndex) => `
              <div class="table-row">
                <div class="col-sr">${startIndex + itemIndex + 1}</div>
                <div class="col-item gujarati-text">${item.productName || 'N/A'}</div>
                <div class="col-qty">${toGujaratiDigits(item.attributes?.quantity || 0)}</div>
                <div class="col-rate">${toGujaratiDigits(item.attributes?.discountedPrice || 0)}</div>
                <div class="col-total">${toGujaratiDigits(item.attributes?.total || 0)}</div>
              </div>
            `).join('')}
            
            ${createEmptyRows(Math.max(0, ITEMS_PER_PAGE - pageItems.length))}
            
            ${closeTable()}
            
            ${!isLastPage ? `
              
              <div class="continuation-notice">
                Continued... (${items.length - endIndex} items remaining)
              </div>
            ` : `
              <div class="total-section">
                ${totalPages > 1 ? `
                  
                ` : ''}
                <div class="grand-total-row">
                  <div class="grand-total-label">Grand Total</div>
                  <div class="grand-total-amount">${toGujaratiDigits(orderTotal)}</div>
                </div>
              </div>
            `}
          </div>
          ${(!isLastPage || orderIndex < selectedOrdersData.length - 1) ? '<div class="page-break"></div>' : ''}
        `;
        }

        return orderHTML;
      }).join('')}
</body>
</html>
`;

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(combinedHTML);
        printWindow.document.close();

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);

        toast.success(`${selectedOrders.size} estimates generated successfully!`);
      } else {
        toast.error('Unable to open print window. Please check popup settings.');
      }
    } catch (error) {
      console.error('Error generating bulk estimates:', error);
      toast.error('Failed to generate estimates');
    } finally {
      setBulkPrinting(false);
    }
  };

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
    // Calculate total
    const grandTotal = orders.reduce((sum, order) => sum + order.cartTotal, 0);

    // Calculate approximate orders per page
    // Considering header (40px), report info (20px), table header (20px), 
    // footer info (30px), grand total (25px) = ~135px used
    // Remaining space: 14cm ≈ 530px - 135px = 395px
    // Each table row ≈ 20px, so approximately 19-20 rows per page
    const ORDERS_PER_PAGE = 18; // Conservative estimate

    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);

    const generateTableRows = (orderList, currentPage, totalPages) => {
      return orderList.map(order => `
      <tr>
        <td>${order.villageName}</td>
        <td>${order.salesAgentName}</td>
        <td>₹${order.cartTotal.toLocaleString('en-IN')}</td>
        <td>${order.orderType === 'take-away' ? 'લઈ જવું' : 'મોકલવુ'}</td>
      </tr>
    `).join('');
    };

    const generatePageContent = (pageOrders, currentPage, totalPages, isLastPage) => {
      const pageTotal = pageOrders.reduce((sum, order) => sum + order.cartTotal, 0);
      const remainingOrders = orders.length - (currentPage * ORDERS_PER_PAGE);

      return `
      <div class="page" style="page-break-after: ${isLastPage ? 'avoid' : 'always'};">
        <div class="header">
          <div class="company-name">Your Company Name</div>
          <div class="report-title">Order Confirmation Report</div>
        </div>
        
        <div class="report-info">
          <div>Date: ${new Date().toLocaleDateString()}</div>
          <div>Page: ${currentPage + 1} of ${totalPages}</div>
        </div>
        
        <div class="orders-container">
          <table>
            <thead>
              <tr>
                <th>Village Name</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Order Type</th>
              </tr>
            </thead>
            <tbody>
              ${generateTableRows(pageOrders, currentPage, totalPages)}
              <tr class="total-row">
                <td colspan="3">Page Total</td>
                <td>₹${pageTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${isLastPage ? `
          <div class="grand-total">
            Grand Total: ₹${grandTotal.toLocaleString('en-IN')}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          ${!isLastPage ? `
            <p class="pagination-info">
              <strong>Next page contains ${Math.min(remainingOrders, ORDERS_PER_PAGE)} more orders</strong>
            </p>
          ` : `
            <p class="pagination-info">
              <strong>Total Orders: ${orders.length} | Total Amount: ₹${grandTotal.toLocaleString('en-IN')}</strong>
            </p>
          `}
        </div>
      </div>
    `;
    };

    // Generate pages
    let pagesHTML = '';
    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * ORDERS_PER_PAGE;
      const endIndex = Math.min(startIndex + ORDERS_PER_PAGE, orders.length);
      const pageOrders = orders.slice(startIndex, endIndex);
      const isLastPage = i === totalPages - 1;

      pagesHTML += generatePageContent(pageOrders, i, totalPages, isLastPage);
    }

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
      margin: 0;
      padding: 0;
      font-size: 9px;
      box-sizing: border-box;
    }
    
    .page {
      width: 10.5cm;
      height: 14cm;
      position: relative;
      padding: 8px;
      box-sizing: border-box;
      margin: 0;
      display: block;
    }
    
    .header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #333;
      padding-bottom: 4px;
    }
    
    .company-name {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    
    .report-title {
      font-size: 10px;
      margin-bottom: 4px;
    }
    
    .report-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-weight: bold;
      font-size: 8px;
    }
    
    .orders-container {
      flex: 1;
      overflow: hidden;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 7px;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 2px 3px;
      text-align: left;
    }
    
    th {
      background-color: #f2f2f2;
      font-weight: bold;
      font-size: 7px;
    }
    
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    
    .grand-total {
      margin-top: 6px;
      text-align: center;
      padding: 4px;
      background-color: #e6f3ff;
      border: 1px solid #0066cc;
      font-weight: bold;
      font-size: 9px;
    }
    
    .footer {
      position: absolute;
      bottom: 8px;
      left: 8px;
      right: 8px;
      text-align: center;
      font-style: italic;
      color: #666;
      font-size: 6px;
    }
    
    .pagination-info {
      margin-top: 4px;
      font-weight: bold;
      color: #333;
      font-size: 7px;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-size: 9px;
      }
      
      .page {
        width: 10.5cm;
        height: 14cm;
        position: relative;
        padding: 8px;
        box-sizing: border-box;
        margin: 0;
        display: block;
      }
      
      .header {
        margin-bottom: 6px;
      }
      
      .company-name {
        font-size: 12px;
      }
      
      .report-title {
        font-size: 10px;
      }
      
      .report-info {
        font-size: 8px;
        margin-bottom: 6px;
      }
      
      table {
        font-size: 7px;
      }
      
      th, td {
        padding: 2px 3px;
        font-size: 7px;
      }
      
      .grand-total {
        font-size: 9px;
        margin-top: 6px;
      }
      
      .footer {
        font-size: 6px;
      }
      
      .pagination-info {
        font-size: 7px;
      }
      
      button {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${pagesHTML}
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
      {/* <div className="bg-white rounded-lg shadow-sm border">
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
      </div> */}

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
                    <th className="text-left p-4">Order Type</th>
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
                          {/* <div className="text-sm text-gray-500">{order.routeName || "-"}</div> */}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">
                            ₹{(order.cartTotal || calculateCartTotal(order.orders)).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          {order.orderType === 'take-away' ? 'લઈ જવું' : 'મોકલવુ'}
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