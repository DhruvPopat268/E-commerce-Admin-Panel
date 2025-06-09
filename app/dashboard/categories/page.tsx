"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
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


type Category = {
  _id: string
  name: string
  image: string
  status: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", status: true })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)

  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false)

  // Fetch categories from backend on component mount
  useEffect(() => {
    setIsMounted(true)
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setIsLoading(true)
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`)
      if (res.status === 200) {
        setCategories(res.data)
      }
    } catch (error) {
      console.error("Failed to fetch categories", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = categories.filter(
    (category) => category && category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddCategory = async () => {
    if (newCategory.name.trim() === "") {
      alert("Please enter a category name")
      return
    }

    if (!imageFile) {
      alert("Please select an image")
      return
    }

    const formData = new FormData()
    formData.append("name", newCategory.name)
    formData.append("status", String(newCategory.status))
    formData.append("image", imageFile)

    try {
      setIsAddingCategory(true)
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Handle different possible response structures
      let newCategoryData;
      if (res.data.category) {
        newCategoryData = res.data.category;
      } else if (res.data.data) {
        newCategoryData = res.data.data;
      } else {
        newCategoryData = res.data;
      }

      // Add new category to the list
      setCategories(prevCategories => [...prevCategories, newCategoryData])

      // Reset form
      setNewCategory({ name: "", status: true })
      setImageFile(null)
      setPreviewImage(null)
      setIsAddDialogOpen(false)
      
      alert("Category added successfully!")
    } catch (error) {
      console.error("Error adding category", error)
      alert("Error adding category. Please try again.")
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleStatus = async (id: string) => {
    const category = categories.find((cat) => cat._id === id)
    if (!category) return

    const updatedStatus = !category.status

    try {
      // Send request to backend to update status
      console.log(id)
      await axios.patch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories/${id}`, {
        status: updatedStatus,
      })

      // Update frontend state
      setCategories(
        categories.map((cat) =>
          cat._id === id ? { ...cat, status: updatedStatus } : cat
        )
      )
    } catch (error) {
      console.error("Failed to update status", error)
      alert("Failed to update status")
    }
  }

  const handleEditClick = (category: Category) => {
    setEditCategory(category)
    setPreviewImage(category.image)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCategory = async () => {
    if (!editCategory) return

    const formData = new FormData()
    formData.append("name", editCategory.name)
    formData.append("status", String(editCategory.status))
    if (imageFile) {
      formData.append("image", imageFile)
    }

    try {
      setIsUpdatingCategory(true)
      const res = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories/${editCategory._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // Handle different possible response structures
      let updatedCategoryData;
      if (res.data.category) {
        updatedCategoryData = res.data.category;
      } else if (res.data.data) {
        updatedCategoryData = res.data.data;
      } else {
        updatedCategoryData = res.data;
      }

      setCategories(categories.map((cat) => (cat._id === editCategory._id ? updatedCategoryData : cat)))
      setEditCategory(null)
      setPreviewImage(null)
      setImageFile(null)
      setIsEditDialogOpen(false)
      
      alert("Category updated successfully!")
    } catch (error) {
      console.error("Failed to update category", error)
      alert("Update failed. Please try again.")
    } finally {
      setIsUpdatingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories/${id}`)
      setCategories(categories.filter((cat) => cat._id !== id))
      alert("Category deleted successfully!")
    } catch (error) {
      console.error("Failed to delete category", error)
      alert("Delete failed. Please try again.")
    }
  }

  const resetAddForm = () => {
    setNewCategory({ name: "", status: true })
    setImageFile(null)
    setPreviewImage(null)
    setIsAddDialogOpen(false)
  }

  const resetEditForm = () => {
    setEditCategory(null)
    setPreviewImage(null)
    setImageFile(null)
    setIsEditDialogOpen(false)
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
              <Button onClick={() => { }} className="bg-teal-600 hover:bg-teal-700 text-white">
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
                  <TableRow key={category._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="relative h-16 w-16 border rounded-md overflow-hidden">
                        <Image
                          src={category.image || '/placeholder-image.jpg'}
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
                        onCheckedChange={() => toggleStatus(category._id)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-blue-500 text-blue-500"
                          onClick={() => handleEditClick(category)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-red-500 text-red-500"
                          onClick={() => handleDeleteCategory(category._id)}
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
      </div>

      {/* Add Category Dialog */}
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
                disabled={isAddingCategory}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Category Image</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="flex-1" 
                  disabled={isAddingCategory}
                />
                {isMounted && previewImage && (
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
                      disabled={isAddingCategory}
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
                  disabled={isAddingCategory}
                />
                <Label>{newCategory.status ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetAddForm}
              disabled={isAddingCategory}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCategory} 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isAddingCategory}
            >
              {isAddingCategory ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Category Name</Label>
              <Input
                id="editName"
                value={editCategory?.name || ""}
                onChange={(e) =>
                  setEditCategory((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                disabled={isUpdatingCategory}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editImage">Category Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="editImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                  disabled={isUpdatingCategory}
                />
                {previewImage && (
                  <div className="relative h-16 w-16">
                    <Image
                      src={previewImage}
                      alt="Preview"
                      fill
                      className="rounded-md object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background"
                      onClick={() => {
                        setPreviewImage(null)
                        setImageFile(null)
                      }}
                      disabled={isUpdatingCategory}
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
                  checked={editCategory?.status || false}
                  onCheckedChange={(checked) =>
                    setEditCategory((prev) =>
                      prev ? { ...prev, status: checked } : prev
                    )
                  }
                  className="data-[state=checked]:bg-teal-500"
                  disabled={isUpdatingCategory}
                />
                <Label>{editCategory?.status ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetEditForm}
              disabled={isUpdatingCategory}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCategory} 
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isUpdatingCategory}
            >
              {isUpdatingCategory ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}