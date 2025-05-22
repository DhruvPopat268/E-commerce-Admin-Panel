"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"
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

// Sample data for categories
const categories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Clothing" },
  { id: 3, name: "Home Decor" },
  { id: 4, name: "Groceries" },
  { id: 5, name: "Sports" },
  { id: 6, name: "Books" },
]

// Sample data for attributes
const attributes = [
  { id: 1, name: "BOX" },
  { id: 2, name: "CARTOON" },
  { id: 3, name: "PSC" },
]

// Sample data for items
const initialItems = [
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

export default function ItemsPage() {
  const [items, setItems] = useState(initialItems)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    image: "",
    status: true,
    stock: { BOX: 0, CARTOON: 0, PSC: 0 },
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddItem = () => {
    if (newItem.name.trim() === "" || newItem.category.trim() === "") return

    const newId = Math.max(0, ...items.map((item) => item.id)) + 1
    const imageUrl = previewImage || "/placeholder.svg?height=100&width=100"

    setItems([
      ...items,
      {
        id: newId,
        name: newItem.name,
        category: newItem.category,
        image: imageUrl,
        status: newItem.status,
        stock: newItem.stock,
      },
    ])

    setNewItem({
      name: "",
      category: "",
      image: "",
      status: true,
      stock: { BOX: 0, CARTOON: 0, PSC: 0 },
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
    setItems(items.map((item) => (item.id === id ? { ...item, status: !item.status } : item)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Items</h2>
          <p className="text-muted-foreground">Manage your product items</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Item Table <span className="text-sm text-gray-500 ml-2">{items.length}</span>
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
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
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
                  <TableHead>Item Name</TableHead>
                  <TableHead>Stock (BOX/CARTOON/PSC)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">BOX: {item.stock.BOX}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">CARTOON: {item.stock.CARTOON}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">PSC: {item.stock.PSC}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.status}
                        onCheckedChange={() => toggleStatus(item.id)}
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

      <Button onClick={() => setIsAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
        <Plus className="mr-2 h-4 w-4" /> Add Item
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Create a new product item with category, name, image, and stock information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newItem.category || ""}
                onValueChange={(value) => setNewItem({ ...newItem, category: value })}
              >
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
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Smartphone X"
              />
            </div>

            <div className="grid gap-2">
              <Label>Stock Information</Label>
              <div className="grid grid-cols-3 gap-4">
                {attributes.map((attribute) => (
                  <div key={attribute.id}>
                    <Label htmlFor={`stock-${attribute.name}`} className="text-sm">
                      {attribute.name}
                    </Label>
                    <Input
                      id={`stock-${attribute.name}`}
                      type="number"
                      min="0"
                      value={newItem.stock[attribute.name as keyof typeof newItem.stock] || 0}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          stock: {
                            ...newItem.stock,
                            [attribute.name]: Number.parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newItem.status}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, status: checked })}
                  className="data-[state=checked]:bg-teal-500"
                />
                <Label>{newItem.status ? "Active" : "Inactive"}</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Item Image</Label>
              <div className="flex items-center gap-4">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                {previewImage && (
                  <div className="relative h-16 w-16">
                    <Image
                      src={previewImage || "/placeholder.svg"}
                      alt="Preview"
                      fill
                      className="rounded-md object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background"
                      onClick={() => setPreviewImage(null)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} className="bg-teal-600 hover:bg-teal-700">
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
