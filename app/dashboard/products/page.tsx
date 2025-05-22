"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  Cloud,
  Tag,
  DollarSign,
  Settings,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

// Sample data for categories
const categories = [
  { id: 1, name: "Fruits and Vegetables" },
  { id: 2, name: "Meat and Fish" },
  { id: 3, name: "Dairy" },
  { id: 4, name: "Beverages" },
  { id: 5, name: "Health Care" },
  { id: 6, name: "Cleaning" },
]

// Sample data for subcategories
const subcategories = {
  "Fruits and Vegetables": ["Vegetables", "Fruits", "Organic"],
  "Meat and Fish": ["Chicken", "Beef", "Fish"],
  Dairy: ["Milk", "Cheese", "Yogurt"],
  Beverages: ["Soft Drinks", "Tea & Coffee", "Juice"],
  "Health Care": ["Antiseptics", "Medicines", "Personal Care"],
  Cleaning: ["Cleaning Supplies", "Detergents", "Air Fresheners"],
}

// Sample data for attributes
const attributes = [
  { id: 1, name: "BOX" },
  { id: 2, name: "CARTOON" },
  { id: 3, name: "PSC" },
]

// Sample data for products
const initialProducts = [
  {
    id: 1,
    name: "Smartphone X",
    category: "Electronics",
    image: "/placeholder.svg?height=100&width=100",
    status: true,
    stock: { BOX: 5, CARTOON: 20, PSC: 100 },
  },
  {
    id: 2,
    name: "Winter Jacket",
    category: "Clothing",
    image: "/placeholder.svg?height=100&width=100",
    status: true,
    stock: { BOX: 3, CARTOON: 15, PSC: 75 },
  },
  {
    id: 3,
    name: "Table Lamp",
    category: "Home Decor",
    image: "/placeholder.svg?height=100&width=100",
    status: true,
    stock: { BOX: 2, CARTOON: 10, PSC: 50 },
  },
  {
    id: 4,
    name: "Organic Apples",
    category: "Groceries",
    image: "/placeholder.svg?height=100&width=100",
    status: false,
    stock: { BOX: 8, CARTOON: 40, PSC: 200 },
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState(initialProducts)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    unit: "Kg",
    capacity: "1",
    maxOrderQuantity: "1",
    weight: "",
    visibility: true,
    image: "",
    tags: "",
    price: "0",
    stock: "0",
    discountType: "Percent",
    discountValue: "0",
    taxType: "Percent",
    taxRate: "0",
    selectedAttributes: ["BOX"],
    attributeValues: { BOX: "" },
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddProduct = () => {
    if (newProduct.name.trim() === "" || newProduct.category.trim() === "") return

    const newId = Math.max(0, ...products.map((product) => product.id)) + 1
    const imageUrl = previewImage || "/placeholder.svg?height=100&width=100"

    // In a real app, you would process all the form fields here
    setProducts([
      ...products,
      {
        id: newId,
        name: newProduct.name,
        category: newProduct.category,
        image: imageUrl,
        status: newProduct.visibility,
        stock: { BOX: Number.parseInt(newProduct.stock), CARTOON: 0, PSC: 0 },
      },
    ])

    // Reset form
    setNewProduct({
      name: "",
      description: "",
      category: "",
      subCategory: "",
      unit: "Kg",
      capacity: "1",
      maxOrderQuantity: "1",
      weight: "",
      visibility: true,
      image: "",
      tags: "",
      price: "0",
      stock: "0",
      discountType: "Percent",
      discountValue: "0",
      taxType: "Percent",
      taxRate: "0",
      selectedAttributes: ["BOX"],
      attributeValues: { BOX: "" },
    })
    setPreviewImage(null)
    setIsAddDialogOpen(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleStatus = (id: number) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, status: !product.status } : product)))
  }

  const handleCategoryChange = (value: string) => {
    setNewProduct({ ...newProduct, category: value, subCategory: "" })
    setSelectedCategory(value)
    setSelectedSubCategory(null)
  }

  const handleSubCategoryChange = (value: string) => {
    setNewProduct({ ...newProduct, subCategory: value })
    setSelectedSubCategory(value)
  }

  const handleAttributeSelect = (attribute: string) => {
    if (!newProduct.selectedAttributes.includes(attribute)) {
      setNewProduct({
        ...newProduct,
        selectedAttributes: [...newProduct.selectedAttributes, attribute],
        attributeValues: { ...newProduct.attributeValues, [attribute]: "" },
      })
    }
  }

  const handleAttributeRemove = (attribute: string) => {
    const updatedAttributes = newProduct.selectedAttributes.filter((attr) => attr !== attribute)
    const updatedValues = { ...newProduct.attributeValues }
    delete updatedValues[attribute]

    setNewProduct({
      ...newProduct,
      selectedAttributes: updatedAttributes,
      attributeValues: updatedValues,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product List</h2>
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Product Table <span className="text-sm text-gray-500 ml-2">{products.length}</span>
            </h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by Name"
                  className="pl-10 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => {}} className="bg-teal-600 hover:bg-teal-700 text-white">
                Search
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px]">SL</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Stock (BOX/CARTOON/PSC)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
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
                    <TableCell>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">BOX: {product.stock.BOX}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                          CARTOON: {product.stock.CARTOON}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">PSC: {product.stock.PSC}</span>
                      </div>
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
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new product with detailed information.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="price">Price</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <div className="flex border rounded-md overflow-hidden">
                    <div className="px-4 py-2 bg-teal-500 text-white">English(EN)</div>
                    <div className="px-4 py-2 text-gray-600">Arabic - العربية(AR)</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (EN)</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="New Product"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description (EN)</Label>
                <div className="border rounded-md">
                  <div className="flex items-center border-b p-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Enter product description"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Category Tab */}
            <TabsContent value="category" className="space-y-4 py-4">
              <div className="flex items-center mb-4">
                <User className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-semibold">Category</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newProduct.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Sub Category</Label>
                  <Select
                    value={newProduct.subCategory}
                    onValueChange={handleSubCategoryChange}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Select a sub category" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory &&
                        subcategories[selectedCategory as keyof typeof subcategories]?.map((subcat) => (
                          <SelectItem key={subcat} value={subcat}>
                            {subcat}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={newProduct.unit}
                    onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="Liter">Liter</SelectItem>
                      <SelectItem value="Piece">Piece</SelectItem>
                      <SelectItem value="Box">Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="text"
                    value={newProduct.capacity}
                    onChange={(e) => setNewProduct({ ...newProduct, capacity: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOrderQuantity">Maximum Order Quantity</Label>
                  <Input
                    id="maxOrderQuantity"
                    type="text"
                    value={newProduct.maxOrderQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, maxOrderQuantity: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (Kg)</Label>
                  <Input
                    id="weight"
                    type="text"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                    placeholder="Ex : 1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Turning Visibility off will not show this product in the user app and website
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Visibility</span>
                  <Switch
                    checked={newProduct.visibility}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, visibility: checked })}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4 py-4">
              <div className="flex items-center mb-4">
                <Cloud className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  Product Image <span className="text-red-500">*</span>{" "}
                  <span className="text-sm text-gray-500">( Ratio 1:1 )</span>
                </h3>
              </div>

              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                {previewImage ? (
                  <div className="relative h-40 w-40">
                    <Image
                      src={previewImage || "/placeholder.svg"}
                      alt="Product preview"
                      fill
                      className="object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white shadow"
                      onClick={() => setPreviewImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Cloud className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-4">Upload Image</p>
                    <Input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="max-w-xs"
                    />
                  </>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <Tag className="mr-2 h-5 w-5" />
                  <h3 className="text-lg font-semibold">Tags</h3>
                </div>
                <Input
                  placeholder="Enter tags"
                  value={newProduct.tags}
                  onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                />
              </div>
            </TabsContent>

            {/* Price Tab */}
            <TabsContent value="price" className="space-y-4 py-4">
              <div className="flex items-center mb-4">
                <DollarSign className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-semibold">Price Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Default Unit Price</Label>
                  <Input
                    id="price"
                    type="text"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Product Stock</Label>
                  <Input
                    id="stock"
                    type="text"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={newProduct.discountType}
                    onValueChange={(value) => setNewProduct({ ...newProduct, discountType: value })}
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percent">Percent</SelectItem>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount (%)</Label>
                  <Input
                    id="discountValue"
                    type="text"
                    value={newProduct.discountValue}
                    onChange={(e) => setNewProduct({ ...newProduct, discountValue: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxType">Tax Type</Label>
                  <Select
                    value={newProduct.taxType}
                    onValueChange={(value) => setNewProduct({ ...newProduct, taxType: value })}
                  >
                    <SelectTrigger id="taxType">
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percent">Percent</SelectItem>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="text"
                    value={newProduct.taxRate}
                    onChange={(e) => setNewProduct({ ...newProduct, taxRate: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-4 py-4">
              <div className="flex items-center mb-4">
                <Settings className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-semibold">Attribute</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Attribute</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Select onValueChange={handleAttributeSelect} value={newProduct.selectedAttributes[0] || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {attributes.map((attr) => (
                            <SelectItem key={attr.id} value={attr.name}>
                              {attr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {newProduct.selectedAttributes.map((attr) => (
                  <div key={attr} className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                    <div>
                      <Input value={attr} readOnly className="bg-gray-50" />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter choice values"
                        value={newProduct.attributeValues[attr] || ""}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            attributeValues: { ...newProduct.attributeValues, [attr]: e.target.value },
                          })
                        }
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-red-500 text-red-500"
                        onClick={() => handleAttributeRemove(attr)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} className="bg-teal-600 hover:bg-teal-700">
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
