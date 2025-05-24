"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import axios from "axios"

import { Package, Cloud, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react";
import { Settings } from "lucide-react";

const categories = [
  { id: 1, name: "Fruits and Vegetables" },
  { id: 2, name: "Meat and Fish" },
  { id: 3, name: "Dairy" },
  { id: 4, name: "Beverages" },
  { id: 5, name: "Health Care" },
  { id: 6, name: "Cleaning" },
]

const subcategories = {
  "Fruits and Vegetables": ["Vegetables", "Fruits", "Organic"],
  "Meat and Fish": ["Chicken", "Beef", "Fish"],
  Dairy: ["Milk", "Cheese", "Yogurt"],
  Beverages: ["Soft Drinks", "Tea & Coffee", "Juice"],
  "Health Care": ["Antiseptics", "Medicines", "Personal Care"],
  Cleaning: ["Cleaning Supplies", "Detergents", "Air Fresheners"],
}

interface AttributeOption {
  _id: string
  name: string
}

interface AttributeItem extends AttributeOption {
  price: string
  discountedPrice: string
}

export default function AddProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.productId as string | undefined

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    visibility: true,
    image: "",
  })

  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeItem[]>([])
  const [currentAttribute, setCurrentAttribute] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([])
  const [fetchedSubcategories, setFetchedSubcategories] = useState<Subcategory[]>([])

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)

  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const attrRes = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/attributes`)
        setAttributeOptions(attrRes.data)
      } catch (err) {
        console.error("Error fetching attributes:", err)
      }

      if (productId) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${productId}`)
          const p = res.data

          setProduct({
            name: p.name || "",
            description: p.description || "",
            category: p.category || "",
            subCategory: p.subCategory || "",
            visibility: p.visibility ?? true,
            image: p.image || "",
          })

          setPreviewImage(p.image || "")
          setTags(p.tags || [])

          if (p.category) {
            setSelectedCategory(p.category)
          }

          if (p.subCategory) {
            setSelectedSubCategory(p.subCategory)
          }

          if (p.attributes && Array.isArray(p.attributes)) {
            const attrs = p.attributes.map((attr: any) => ({
              _id: attr._id || "",
              name: attr.name,
              price: attr.price,
              discountedPrice: attr.discountedPrice,
            }))
            setSelectedAttributes(attrs)
          }

        } catch (err) {
          console.error("Failed to load product:", err)
        }
      }
    }
    fetchInitialData()

    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`) // Adjust if your API base path is different
        setFetchedCategories(data)
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      }
    }

    const fetchSubcategories = async () => {
      try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subcategories`)
        setFetchedSubcategories(data)
      } catch (err) {
        console.error("Failed to fetch subcategories:", err)
      }
    }

    fetchCategories()
    fetchSubcategories()
  }, [productId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string)
        setProduct(prev => ({ ...prev, image: "" })) // Clear product.image since we show preview
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




  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleAttributeSelect = (name: string) => {
    const attr = attributeOptions.find(a => a.name === name)
    if (attr && !selectedAttributes.some(a => a.name === name)) {
      setSelectedAttributes([...selectedAttributes, { ...attr, price: "", discountedPrice: "" }])
      setCurrentAttribute("")
    }
  }

  const removeAttribute = (name: string) => {
    setSelectedAttributes(selectedAttributes.filter(a => a.name !== name))
  }

  const updateAttributeValues = (
    name: string,
    field: "price" | "discountedPrice",
    value: string
  ) => {
    setSelectedAttributes(prev =>
      prev.map(attr => attr.name === name ? { ...attr, [field]: value } : attr)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const productData = {
      ...product,
      image: previewImage,
      tags,
      attributes: selectedAttributes,
    }

    try {
      if (productId) {
        // Update product
        await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${productId}`, productData)
      } else {
        // Create product
        await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`, productData)
      }

      router.push("/dashboard/products")
    } catch (err: any) {
      console.error("Save failed:", err.response?.data || err.message)
      alert("Failed to save product.")
    }
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


              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
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
                <Label htmlFor="description">Short Description</Label>
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
                      {fetchedCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
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
                      {fetchedSubcategories
                        .filter((subcat) => subcat.category === selectedCategory)
                        .map((subcat) => (
                          <SelectItem key={subcat._id} value={subcat.name}>
                            {subcat.name}
                          </SelectItem>
                        ))}

                    </SelectContent>
                  </Select>

                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600 mt-20">
                  Turning Visibility off will not show this product in the user app and website
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium mt-20">Visibility</span>
                  <Switch
                    checked={product.visibility}
                    onCheckedChange={(checked) => setProduct({ ...product, visibility: checked })}
                    className="data-[state=checked]:bg-teal-500 mt-20"
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
              {tags.map((tag) => (
                <Badge
                  key={tag}
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
        <div className="grid  grid-cols-1 md:grid-cols-2 gap-8">

          {/* Right Column - Attributes */}
          <div className="bg-white  rounded-lg p-6 border border-gray-200">
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
                      <div className="grid grid-cols-3 gap-4">
                        <Input value={attr.name} readOnly className="border-gray-300 bg-gray-50" />
                        <Input
                          placeholder="Enter Price"
                          value={attr.price}
                          onChange={(e) => updateAttributeValues(attr.name, 'price', e.target.value)}
                          className="border-gray-300"
                        />

                        <Input
                          placeholder="Enter Price After Discount"
                          value={attr.discountedPrice}
                          onChange={(e) => updateAttributeValues(attr.name, 'discountedPrice', e.target.value)}
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
      </form>``
    </div>
  )
}
