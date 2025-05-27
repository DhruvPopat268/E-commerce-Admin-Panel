"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Pencil, Trash2, Download, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([]) // New state for categories
  const [subcategories, setSubcategories] = useState([]) // New state for subcategories
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`),
          axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`),
          axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subcategories`)
        ])

        if (productsRes.status === 200) {
          setProducts(productsRes.data)
        }
        if (categoriesRes.status === 200) {
          setCategories(categoriesRes.data)
        }
        if (subcategoriesRes.status === 200) {
          setSubcategories(subcategoriesRes.data)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId)
    return category ? category.name : 'N/A'
  }

  // Helper function to get subcategory name by ID
  const getSubcategoryName = (subcategoryId) => {
    const subcategory = subcategories.find(sub => sub._id === subcategoryId)
    return subcategory ? subcategory.name : 'N/A'
  }

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id?.toString().includes(searchQuery),
    )
  }, [products, searchQuery])

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

  const toggleStatus = async (id: string) => {
    const product = products.find(p => p._id === id)
    if (!product) return

    const updatedProducts = products.map(p =>
      p._id === id ? { ...p, status: !p.status } : p
    )
    setProducts(updatedProducts)

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${id}/status`, {
        status: !product.status,
      })
    } catch (error) {
      console.error("Failed to update status:", error)
      setProducts(products)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${id}`)
      setProducts(products.filter((product) => product._id !== id))
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const handleEdit = (productId: string) => {
    router.push(`/dashboard/products/add?productId=${productId}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
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
          <Button onClick={() => { }} className="bg-teal-600 hover:bg-teal-700 text-white">
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
              <TableHead>Category</TableHead> {/* New column */}
              <TableHead>Subcategory</TableHead> {/* New column */}
              <TableHead>Selling Price</TableHead>
              <TableHead>Discounted Price</TableHead>
              <TableHead>Show In Daily Needs</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => (
              <TableRow key={product._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 border rounded-md overflow-hidden">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}/uploads/${product.image}` || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getCategoryName(product.category)}
                </TableCell>
                <TableCell>
                  {getSubcategoryName(product.subCategory)}
                </TableCell>
                <TableCell>
                  {(() => {
                    const unitAttr = product.attributes?.find(attr => attr.name === "Unit");
                    return unitAttr ? `${unitAttr.price}` : "N/A";
                  })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const unitAttr = product.attributes?.find(attr => attr.name === "Unit");
                    return unitAttr ? `${unitAttr.discountedPrice}` : "N/A";
                  })()}
                </TableCell>
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
                    onCheckedChange={() => toggleStatus(product._id)}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-blue-500 text-blue-500"
                      onClick={() => handleEdit(product._id)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-red-500 text-red-500"
                      onClick={() => handleDelete(product._id)}
                    >
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