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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"

// Sample data for categories
const initialCategories = [
  {
    id: 1,
    name: "Meat and Fish",
    image: "/placeholder.svg?height=60&width=60",
    status: true,
  },
  {
    id: 2,
    name: "Fruits and Vegetables",
    image: "/placeholder.svg?height=60&width=60",
    status: false,
  },
  {
    id: 3,
    name: "Breakfast",
    image: "/placeholder.svg?height=60&width=60",
    status: true,
  },
  {
    id: 4,
    name: "Beverages",
    image: "/placeholder.svg?height=60&width=60",
    status: true,
  },
  {
    id: 5,
    name: "Health Care",
    image: "/placeholder.svg?height=60&width=60",
    status: true,
  },
  {
    id: 6,
    name: "Cleaning",
    image: "/placeholder.svg?height=60&width=60",
    status: true,
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState(initialCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", image: "", status: true })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddCategory = () => {
    if (newCategory.name.trim() === "") return

    const newId = Math.max(0, ...categories.map((c) => c.id)) + 1
    const imageUrl = previewImage || "/placeholder.svg?height=60&width=60"

    setCategories([
      ...categories,
      {
        id: newId,
        name: newCategory.name,
        image: imageUrl,
        status: newCategory.status,
      },
    ])

    setNewCategory({ name: "", image: "", status: true })
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
    setCategories(
      categories.map((category) => (category.id === id ? { ...category, status: !category.status } : category)),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage your product categories</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Category Table <span className="text-sm text-gray-500 ml-2">{categories.length}</span>
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
                  <TableHead className="w-[150px]">Category Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="relative h-16 w-16 border rounded-md overflow-hidden">
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={category.status}
                        onCheckedChange={() => toggleStatus(category.id)}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new product category with name and image.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g. Electronics"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Category Image</Label>
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
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCategory.status}
                  onCheckedChange={(checked) => setNewCategory({ ...newCategory, status: checked })}
                  className="data-[state=checked]:bg-teal-500"
                />
                <Label>{newCategory.status ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className="bg-teal-600 hover:bg-teal-700">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
