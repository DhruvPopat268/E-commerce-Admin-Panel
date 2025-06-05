
"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Calendar, Eye, Printer, Download, Clock, Check, Loader2, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function PendingOrdersPage() {
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

  useEffect(() => {
    setIsMounted(true)
    fetchPendingOrders()
  }, [])

  // Update selectAll state when selectedOrders changes
  useEffect(() => {
    if (pendingOrders.length > 0) {
      setSelectAll(selectedOrders.size === pendingOrders.length)
    }
  }, [selectedOrders, pendingOrders])

  // Mock data for demonstration
  useEffect(() => {
    if (isMounted) {
      const mockOrders: Order[] = [
        {
          _id: "6841790b4cf136a49533da8",
          userId: "user123456",
          orders: [
            {
              productId: "prod1",
              productName: "Tea-Tree Face wash",
              image: "/api/placeholder/60/60",
              attributes: {
                _id: "attr1",
                name: "Unit",
                discountedPrice: 350,
                quantity: 1,
                total: 350
              },
              _id: "order1"
            }
          ],
          status: "pending",
          orderDate: "2025-06-05T09:35:00Z",
          __v: 0,
          cartTotal: 350,
          salesAgentName: "Vimal Sarvaiya",
          salesAgentMobile: "9067787232",
          villageName: "surat (સુરત)",
          routeName: "Route 2"
        }
      ]
      setPendingOrders(mockOrders)
      setLoading(false)
    }
  }, [isMounted])

  const fetchPendingOrders = async () => {
    try {
      setLoading(true)
      // Replace with your actual API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/all`)
      const data = await response.json()

      if (data.orders) {
        const pending = data.orders.filter((order: Order) => order.status.toLowerCase() === 'pending')
        setPendingOrders(pending)
        setSelectedOrders(new Set())
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error)
      toast.error('Failed to fetch pending orders')
    } finally {
      setLoading(false)
    }
  }

  const generateInvoiceHTML = (order: Order) => {
    const orderTotal = order.cartTotal || calculateCartTotal(order.orders)
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice - ${order._id.slice(-6).toUpperCase()}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #teal; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #14b8a6; margin-bottom: 5px; }
            .invoice-title { font-size: 24px; color: #666; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-section { flex: 1; }
            .info-section h3 { color: #14b8a6; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
            .order-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .order-table th, .order-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            .order-table th { background-color: #f8fafc; font-weight: bold; color: #374151; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-row { display: flex; justify-content: flex-end; margin-bottom: 10px; }
            .total-label { font-weight: bold; margin-right: 20px; min-width: 120px; }
            .total-amount { font-weight: bold; min-width: 100px; }
            .grand-total { font-size: 18px; color: #14b8a6; border-top: 2px solid #14b8a6; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="invoice-header">
            <div class="company-name">Your Company Name</div>
            <div class="invoice-title">INVOICE</div>
        </div>
        
        <div class="invoice-info">
            <div class="info-section">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${order._id.slice(-6).toUpperCase()}</p>
                <p><strong>Order Date:</strong> ${formatDate(order.orderDate)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Invoice Date:</strong> ${currentDate}</p>
            </div>
            
            <div class="info-section">
                <h3>Customer Details</h3>
                <p><strong>Sales Agent:</strong> ${order.salesAgentName || 'N/A'}</p>
                <p><strong>Mobile:</strong> ${order.salesAgentMobile || 'N/A'}</p>
                <p><strong>Village:</strong> ${order.villageName || 'N/A'}</p>
                <p><strong>Route:</strong> ${order.routeName || 'N/A'}</p>
            </div>
        </div>
        
        <table class="order-table">
            <thead>
                <tr>
                    <th>SL</th>
                    <th>Item Details</th>
                    <th>Attribute</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Discount Price</th>
                    <th>Total Price</th>
                </tr>
            </thead>
            <tbody>
                ${order.orders.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.productName}</td>
                        <td>${item.attributes.name}</td>
                        <td>₹${item.attributes.discountedPrice}</td>
                        <td>${item.attributes.quantity}</td>
                        <td>₹${item.attributes.discountedPrice}</td>
                        <td>₹${item.attributes.total}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="total-row grand-total">
                <div class="total-label">Grand Total:</div>
                <div class="total-amount">₹${orderTotal.toLocaleString()}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer generated invoice.</p>
        </div>
    </body>
    </html>
    `
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
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              .page-break { page-break-after: always; }
              .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #teal; padding-bottom: 20px; }
              .company-name { font-size: 28px; font-weight: bold; color: #14b8a6; margin-bottom: 5px; }
              .invoice-title { font-size: 24px; color: #666; }
              .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .info-section { flex: 1; }
              .info-section h3 { color: #14b8a6; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
              .order-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .order-table th, .order-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
              .order-table th { background-color: #f8fafc; font-weight: bold; color: #374151; }
              .total-section { text-align: right; margin-top: 20px; }
              .total-row { display: flex; justify-content: flex-end; margin-bottom: 10px; }
              .total-label { font-weight: bold; margin-right: 20px; min-width: 120px; }
              .total-amount { font-weight: bold; min-width: 100px; }
              .grand-total { font-size: 18px; color: #14b8a6; border-top: 2px solid #14b8a6; padding-top: 10px; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
              @media print { body { margin: 0; } }
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
            <div${index < selectedOrdersData.length - 1 ? ' class="page-break"' : ''}>
                <div class="invoice-header">
                    <div class="company-name">Your Company Name</div>
                    <div class="invoice-title">INVOICE</div>
                </div>
                
                <div class="invoice-info">
                    <div class="info-section">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> ${order._id.slice(-6).toUpperCase()}</p>
                        <p><strong>Order Date:</strong> ${formatDate(order.orderDate)}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Invoice Date:</strong> ${currentDate}</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Customer Details</h3>
                        <p><strong>Sales Agent:</strong> ${order.salesAgentName || 'N/A'}</p>
                        <p><strong>Mobile:</strong> ${order.salesAgentMobile || 'N/A'}</p>
                        <p><strong>Village:</strong> ${order.villageName || 'N/A'}</p>
                        <p><strong>Route:</strong> ${order.routeName || 'N/A'}</p>
                    </div>
                </div>
                
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>SL</th>
                            <th>Item Details</th>
                            <th>Attribute</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Discount Price</th>
                            <th>Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.orders.map((item, itemIndex) => `
                            <tr>
                                <td>${itemIndex + 1}</td>
                                <td>${item.productName}</td>
                                <td>${item.attributes.name}</td>
                                <td>₹${item.attributes.discountedPrice}</td>
                                <td>${item.attributes.quantity}</td>
                                <td>₹${item.attributes.discountedPrice}</td>
                                <td>₹${item.attributes.total}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-row grand-total">
                        <div class="total-label">Grand Total:</div>
                        <div class="total-amount">₹${orderTotal.toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>This is a computer generated invoice.</p>
                </div>
            </div>
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
    // router.push(`/dashboard/order-details/${orderId}`)
    console.log('View order:', orderId)
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
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          {pendingOrders.length}
        </span>
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
          <button 
            onClick={printBulkInvoices}
            disabled={selectedOrders.size === 0 || bulkPrinting}
            className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedOrders.size === 0 || bulkPrinting
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
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 font-semibold w-12">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="text-left p-4 font-semibold">SL</th>
                  <th className="text-left p-4 font-semibold">Order ID</th>
                  <th className="text-left p-4 font-semibold">Order Date</th>
                  <th className="text-left p-4 font-semibold">Customer</th>
                  <th className="text-left p-4 font-semibold">Total Amount</th>
                  <th className="text-left p-4 font-semibold">Order Status</th>
                  <th className="text-left p-4 font-semibold">Action</th>
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
                          onChange={(e) =>
                            handleSelectOrder(order._id, e.target.checked)
                          }
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-4">{index + 1}</td>
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
                          <button 
                            className="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                      
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}