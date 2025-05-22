"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Pencil, Trash2, Download, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for products
const initialProducts = [
  {
    id: 1,
    name: "Premium Quality Body...",
    image: "/placeholder.svg?height=60&width=60",
    price: "470.00",
    totalSale: 7,
    showInDailyNeeds: false,
    featured: false,
    status: true,
  },
  {
    id: 2,
    name: "Glass cleaner Mop",
    image: "/placeholder.svg?height=60&width=60",
    price: "180.00",
    totalSale: 5,
    showInDailyNeeds: false,
    featured: false,
    status: true,
  },
  {
    id: 3,
    name: "Rok Cleaner - Super...",
    image: "/placeholder.svg?height=60&width=60",
    price: "205.00",
    totalSale: 9,
    showInDailyNeeds: true,
    featured: false,
    status: true,
  },
  {
    id: 4,
    name: "78% Alcohol Hand San...",
    image: "/placeholder.svg?height=60&width=60",
    price: "120.00",
    totalSale: 2,
    showInDailyNeeds: false,
    featured: false,
    status: true,
  },
  {
    id: 5,
    name: "Natural Bio Yogurt",
    image: "/placeholder.svg?height=60&width=60",
    price: "200.00",
    totalSale: 4,
    showInDailyNeeds: true,
    featured: true,
    status: true,
  },
  {
    id: 6,
    name: "Pure Mixed Fruits Ja...",
    image: "/placeholder.svg?height=60&width=60",
    price: "230.00",
    totalSale: 2,
    showInDailyNeeds: false,
    featured: false,
    status: true,
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.id.toString().includes(searchQuery),
  )

  const toggleShowInDailyNeeds = (id: number) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, showInDailyNeeds: !product.showInDailyNeeds } : product,
      ),
    )
  }

  const toggleFeatured = (id: number) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, featured: !product.featured } : product)))
  }

  const toggleStatus = (id: number) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, status: !product.status } : product)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-8 w-8 text-amber-600" />
        <h2 className="text-3xl font-bold tracking-tight">
          Product List <span className="text-sm text-gray-500 ml-2">{products.length}</span>
        </h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative w-full md:w-80">
            <Input
              placeholder="Search by ID or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3"
            />
          </div>
          <Button onClick={() => {}} className="bg-teal-600 hover:bg-teal-700 text-white">
            Search
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-teal-500 text-teal-500">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button className="bg-teal-500 hover:bg-teal-600 text-white">Limited Stocks</Button>
          <Button asChild className="bg-teal-700 hover:bg-teal-800 text-white">
            <Link href="/dashboard/products/add">+ Add new product</Link>
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[60px]">SL</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Total Sale</TableHead>
              <TableHead>Show In Daily Needs</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 border rounded-md overflow-hidden">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{product.price}$</TableCell>
                <TableCell>{product.totalSale}</TableCell>
                <TableCell>
                  <Switch
                    checked={product.showInDailyNeeds}
                    onCheckedChange={() => toggleShowInDailyNeeds(product.id)}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.featured}
                    onCheckedChange={() => toggleFeatured(product.id)}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.status}
                    onCheckedChange={() => toggleStatus(product.id)}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 border-blue-500 text-blue-500">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 border-red-500 text-red-500">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
