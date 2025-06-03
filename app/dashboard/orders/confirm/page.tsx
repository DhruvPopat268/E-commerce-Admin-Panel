"use client"

import { useState, useEffect } from "react"
import React from "react"
import { useRouter } from "next/navigation" 
import { Calendar, Eye, Printer, Download, CheckCircle, Package, Truck } from "lucide-react"
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
}

export default function ConfirmedOrdersPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [shippingOrders, setShippingOrders] = useState(false)
const router = useRouter()
  useEffect(() => {
    setIsMounted(true)
    fetchConfirmedOrders()
  }, [])

  // Update selectAll state when selectedOrders changes
  useEffect(() => {
    if (confirmedOrders.length > 0) {
      setSelectAll(selectedOrders.size === confirmedOrders.length)
    }
  }, [selectedOrders, confirmedOrders])

  const fetchConfirmedOrders = async () => {
    try {
      setLoading(true)
      // Replace with your actual API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/all`)
      const data = await response.json()

      if (data.orders) {
        // Filter only confirmed orders
        const confirmed = data.orders.filter((order: Order) => order.status.toLowerCase() === 'confirmed')
        setConfirmedOrders(confirmed)
        setSelectedOrders(new Set()) // Clear selections when data refreshes
      }
    } catch (error) {
      console.error('Error fetching confirmed orders:', error)
      toast.error('Failed to fetch confirmed orders')
    } finally {
      setLoading(false)
    }
  }

    const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/order-details/${orderId}`)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedOrders(new Set(confirmedOrders.map(order => order._id)))
    } else {
      setSelectedOrders(new Set())
    }
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

  const markAsShipped = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to mark as shipped')
      return
    }

    try {
      setShippingOrders(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/mark-shipped`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      })

      const data = await response.json()

      if (response.ok) {
        // Remove shipped orders from confirmed orders list
        setConfirmedOrders(prev => prev.filter(order => !selectedOrders.has(order._id)))
        setSelectedOrders(new Set())
        setSelectAll(false)
        toast.success(`${selectedOrders.size} order(s) marked as shipped successfully!`)
      } else {
        toast.error(data.message || 'Failed to mark orders as shipped')
      }
    } catch (error) {
      console.error('Error marking orders as shipped:', error)
      toast.error('Failed to mark orders as shipped')
    } finally {
      setShippingOrders(false)
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
    // Implement search functionality here
    console.log('Searching for:', searchTerm)
  }

  const handleShowData = () => {
    // Implement date range filtering here
    console.log('Filtering from:', startDate, 'to:', endDate)
  }

  const exportToCSV = () => {
    // Implement CSV export functionality
    const csvContent = confirmedOrders.map((order, index) => {
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
    a.download = 'confirmed-orders.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">Confirmed Orders</h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {confirmedOrders.length}
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
        <button
          onClick={exportToCSV}
          className="px-4 py-2 border border-teal-600 text-teal-600 rounded-md bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <Download className="h-4 w-4 mr-2 inline" />
          Export
        </button>
      </div>

      {/* Bulk Actions */}
      {confirmedOrders.length > 0 && (
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
                    Select All ({confirmedOrders.length} orders)
                  </label>
                </div>
                {selectedOrders.size > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedOrders.size} selected
                  </span>
                )}
              </div>
              <button
                onClick={markAsShipped}
                disabled={selectedOrders.size === 0 || shippingOrders}
                className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${selectedOrders.size === 0 || shippingOrders
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {shippingOrders ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-pulse inline" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2 inline" />
                    Mark as Shipped ({selectedOrders.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading confirmed orders...</div>
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
                {confirmedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No confirmed orders found
                    </td>
                  </tr>
                ) : (
                  confirmedOrders.map((order, index) => (
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
                     <div className="font-medium text-gray-800">{order.salesAgentName
                          || "N/A"}</div>
                        <div className="text-sm text-gray-500">{order.salesAgentMobile
                          || "-"}</div>
                        <div className="font-medium text-gray-800">{order.villageName
                          || "N/A"}</div>
                        <div className="text-sm text-gray-500">{order.routeName
                          || "-"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          ₹{(order.cartTotal || calculateCartTotal(order.orders)).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmed
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
                          <button className="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
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