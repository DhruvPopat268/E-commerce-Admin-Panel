"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Cloud, Package, Tag, DollarSign, Settings, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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
const attributeOptions = [
  { id: 1, name: "Size" },
  { id: 2, name: "Color" },
  { id: 3, name: "BOX" },
  { id: 4, name: "CARTOON" },
  { id: 5, name: "PSC" },
]

interface AttributeItem {
  id: number
  name: string
  values: string
}

export default function AddProductPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeItem[]>([])
  const [currentAttribute, setCurrentAttribute] = useState<string>("")
  const tagInputRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState({
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
    price: "0",
    stock: "0",
    discountType: "Amount", // Changed from "Percent" to "Amount"
    discountValue: "0",
    taxType: "Amount", // Changed from "Percent" to "Amount"
    taxRate: "0",
  })

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

  const handleCategoryChange = (value: string) => {
    setProduct({ ...product, category: value, subCategory: "" })
    setSelectedCategory(value)
    setSelectedSubCategory(null)
  }

  const handleSubCategoryChange = (value: string) => {
    setProduct({ ...product, subCategory: value })
    setSelectedSubCategory(value)
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleAttributeSelect = (value: string) => {
    setCurrentAttribute("")

    // Find the attribute in options
    const attributeOption = attributeOptions.find((attr) => attr.name === value)
    if (!attributeOption) return

    // Check if attribute is already selected
    if (selectedAttributes.some((attr) => attr.name === value)) return

    // Add the new attribute
    setSelectedAttributes([...selectedAttributes, { id: attributeOption.id, name: value, values: "" }])
  }

  const removeAttribute = (attrName: string) => {
    setSelectedAttributes(selectedAttributes.filter((attr) => attr.name !== attrName))
  }

  const updateAttributeValues = (attrName: string, values: string) => {
    setSelectedAttributes(selectedAttributes.map((attr) => (attr.name === attrName ? { ...attr, values } : attr)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save the product to your database here
    console.log("Product data:", {
      ...product,
      image: previewImage,
      tags,
      attributes: selectedAttributes,
    })

    // Redirect back to the products list
    router.push("/dashboard/products")
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Package className="h-8 w-8 text-amber-600" />
        <h2 className="text-3xl font-bold tracking-tight">Add New Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name and Category Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Name and Description */}
          <div className="space-y-6">
            <div>
              <div className="flex border-b mb-4">
                <div className="px-4 py-2 border-b-2 border-teal-500 text-teal-500">English(EN)</div>
                <div className="px-4 py-2 text-gray-600">Arabic - العربية(AR)</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (EN)</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  placeholder="New Product"
                  required
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2 mt-6">
                <Label htmlFor="description">Short Description (EN)</Label>
                <div className="border rounded-md">
                  <div className="flex items-center border-b p-2 bg-gray-50">
                    <div className="flex space-x-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                        <span className="font-bold">B</span>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                        <span className="italic">I</span>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                        <span className="underline">U</span>
                      </Button>
                    </div>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    <div className="flex space-x-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                        <span>•</span>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                        <span>1.</span>
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="description"
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    placeholder="Enter product description"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Category */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <User className="mr-2 h-5 w-5" />
              <h3 className="text-lg font-semibold">Category</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={product.category} onValueChange={handleCategoryChange} required>
                    <SelectTrigger id="category" className="border-gray-300">
                      <SelectValue placeholder="---Select---" />
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
                    value={product.subCategory}
                    onValueChange={handleSubCategoryChange}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="subcategory" className="border-gray-300">
                      <SelectValue placeholder="---Select---" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={product.unit} onValueChange={(value) => setProduct({ ...product, unit: value })}>
                    <SelectTrigger id="unit" className="border-gray-300">
                      <SelectValue placeholder="Kg" />
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
                    value={product.capacity}
                    onChange={(e) => setProduct({ ...product, capacity: e.target.value })}
                    placeholder="1"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxOrderQuantity">Maximum Order Quantity</Label>
                  <Input
                    id="maxOrderQuantity"
                    type="text"
                    value={product.maxOrderQuantity}
                    onChange={(e) => setProduct({ ...product, maxOrderQuantity: e.target.value })}
                    placeholder="1"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (Kg)</Label>
                  <Input
                    id="weight"
                    type="text"
                    value={product.weight}
                    onChange={(e) => setProduct({ ...product, weight: e.target.value })}
                    placeholder="Ex : 1"
                    className="border-gray-300"
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
                    checked={product.visibility}
                    onCheckedChange={(checked) => setProduct({ ...product, visibility: checked })}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image and Tags Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Cloud className="mr-2 h-5 w-5" />
              <h3 className="text-lg font-semibold">
                Product Image <span className="text-red-500">*</span>{" "}
                <span className="text-sm text-gray-500">( Ratio 1:1 )</span>
              </h3>
            </div>

            <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center h-48">
              {previewImage ? (
                <div className="relative h-32 w-32">
                  <Image
                    src={previewImage || "/placeholder.svg"}
                    alt="Product preview"
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white shadow"
                    onClick={() => setPreviewImage(null)}
                  >
                    <span className="sr-only">Remove image</span>×
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
                    className="max-w-xs border-gray-300"
                    required
                  />
                </>
              )}
            </div>
          </div>

          {/* Right Column - Tags */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Tag className="mr-2 h-5 w-5" />
              <h3 className="text-lg font-semibold">Tags</h3>
            </div>

            <div className="border rounded-md p-2 flex flex-wrap gap-2 min-h-[42px]">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  className="bg-green-500 hover:bg-green-600 px-3 py-1 text-white flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length > 0 ? "" : "Enter tags"}
                className="flex-1 min-w-[120px] outline-none border-0 focus:ring-0 p-0 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Price Information and Attributes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Price Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <DollarSign className="mr-2 h-5 w-5" />
              <h3 className="text-lg font-semibold">Price Information</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Default Unit Price</Label>
                  <Input
                    id="price"
                    type="text"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    placeholder="0"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Product Stock</Label>
                  <Input
                    id="stock"
                    type="text"
                    value={product.stock}
                    onChange={(e) => setProduct({ ...product, stock: e.target.value })}
                    placeholder="0"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={product.discountType}
                    onValueChange={(value) => setProduct({ ...product, discountType: value })}
                  >
                    <SelectTrigger id="discountType" className="border-gray-300">
                      <SelectValue placeholder="Amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                      <SelectItem value="Amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {product.discountType === "Percentage" ? "Discount (%)" : "Discount"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="text"
                    value={product.discountValue}
                    onChange={(e) => setProduct({ ...product, discountValue: e.target.value })}
                    placeholder="0"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxType">Tax Type</Label>
                  <Select value={product.taxType} onValueChange={(value) => setProduct({ ...product, taxType: value })}>
                    <SelectTrigger id="taxType" className="border-gray-300">
                      <SelectValue placeholder="Amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                      <SelectItem value="Amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">{product.taxType === "Percentage" ? "Tax Rate (%)" : "Tax Rate"}</Label>
                  <Input
                    id="taxRate"
                    type="text"
                    value={product.taxRate}
                    onChange={(e) => setProduct({ ...product, taxRate: e.target.value })}
                    placeholder="0"
                    className="border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Attributes */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Settings className="mr-2 h-5 w-5" />
              <h3 className="text-lg font-semibold">Attribute</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Attribute</Label>
                <Select value={currentAttribute} onValueChange={handleAttributeSelect}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributeOptions
                      .filter((attr) => !selectedAttributes.some((selected) => selected.name === attr.name))
                      .map((attr) => (
                        <SelectItem key={attr.id} value={attr.name}>
                          {attr.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAttributes.length > 0 && (
                <div className="mt-4 space-y-4">
                  {selectedAttributes.map((attr, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center border rounded-md px-3 py-2">
                        <span className="flex-1">{attr.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(attr.name)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input value={attr.name} readOnly className="border-gray-300 bg-gray-50" />
                        <Input
                          placeholder="Enter choice values"
                          value={attr.values}
                          onChange={(e) => updateAttributeValues(attr.name, e.target.value)}
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}
