"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Eye, Printer, Download, ClipboardList } from "lucide-react"

interface Order {
  _id: string
  userId: string
  user: {
    name: string
    mobile: string
  }
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
}

const statusCards = [
  { label: "Pending", icon: "📋", color: "text-orange-600" },
  { label: "Confirmed", icon: "✅", color: "text-green-600" },
  { label: "Out For Delivery", icon: "🚚", color: "text-purple-600" },
  { label: "Completed", icon: "✅", color: "text-green-700" },
  { label: "Canceled", icon: "❌", color: "text-red-600" },
]

export default function AllOrdersPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/all`)
      const data = await response.json()
      console.log(data.orders)

      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      case "out for delivery":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      confirmed: 0,
      'out for delivery': 0,
      completed: 0,
      canceled: 0
    }

    orders.forEach(order => {
      const status = order.status.toLowerCase()
      if (counts.hasOwnProperty(status)) {
        counts[status as keyof typeof counts]++
      }
    })

    return counts
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  if (!isMounted) {
    return null
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          {orders.length}
        </Badge>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Select Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="yy-mm-dd"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="yy-mm-dd"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700">Show Data</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusCards.map((card, index) => {
          const count = statusCounts[card.label.toLowerCase() as keyof typeof statusCounts] || 0
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="font-medium text-gray-700">{card.label}</span>
                  </div>
                  <span className={`text-2xl font-bold ${card.color}`}>{count}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Ex : Search by ID, order or payment status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
          />
          <Button className="bg-teal-600 hover:bg-teal-700">Search</Button>
        </div>
        <Button variant="outline" className="text-teal-600 border-teal-600 hover:bg-teal-50">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading orders...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">SL</TableHead>
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Order Date</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Total Amount</TableHead>
                  <TableHead className="font-semibold">Order Status</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, index) => (
                    <TableRow key={order._id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {order._id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-800">{order.salesAgentName
                          || "N/A"}</div>
                        <div className="text-sm text-gray-500">{order.salesAgentMobile
                          || "-"}</div>
                        <div className="font-medium text-gray-800">{order.villageName
                          || "N/A"}</div>
                        <div className="text-sm text-gray-500">{order.routeName
                          || "-"}</div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">
                          ₹{calculateCartTotal(order.orders).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}