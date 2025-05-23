"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSubCategory, setNewSubCategory] = useState({ categoryId: "", name: "", status: true })
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)


  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("http://localhost:7000/api/categories")
      setCategories(data)
    } catch (err) {
      console.error("Failed to fetch categories", err)
    }
  }

  // Fetch subcategories from backend
  const fetchSubCategories = async () => {
    try {
      const { data } = await axios.get("http://localhost:7000/api/subcategories")
      setSubCategories(data)
    } catch (err) {
      console.error("Failed to fetch subcategories", err)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
  })

  const filteredSubCategories = subCategories.filter(
    (subCategory) =>
      subCategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subCategory.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Add new subcategory via API
  const handleSaveSubCategory = async () => {
    if (!newSubCategory.name.trim() || !newSubCategory.categoryId) return

    try {
      if (isEditMode) {
        const { data } = await axios.patch(`http://localhost:7000/api/subcategories/${editingId}`, {
          categoryId: newSubCategory.categoryId,
          name: newSubCategory.name,
          status: newSubCategory.status,
        })

        setSubCategories((prev) => prev.map((sc) => sc._id === editingId ? data : sc))
      } else {
        const { data } = await axios.post("http://localhost:7000/api/subcategories", {
          categoryId: newSubCategory.categoryId,
          name: newSubCategory.name,
          status: newSubCategory.status,
        })

        setSubCategories((prev) => [...prev, data])
      }

      setNewSubCategory({ categoryId: "", name: "", status: true })
      setIsAddDialogOpen(false)
      setIsEditMode(false)
      setEditingId(null)
    } catch (err) {
      console.error(err)
    }
  }


  // Toggle subcategory status via API PATCH
  const toggleStatus = async (id, currentStatus) => {
    try {
      const { data } = await axios.patch(`http://localhost:7000/api/subcategories/${id}`, {
        status: !currentStatus,
      })

      setSubCategories((prev) =>
        prev.map((sc) => (sc._id === id ? data : sc)),
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Delete subcategory via API DELETE
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return

    try {
      await axios.delete(`http://localhost:7000/api/subcategories/${id}`)
      setSubCategories((prev) => prev.filter((sc) => sc._id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sub Categories</h2>
          <p className="text-muted-foreground">Manage your product sub categories</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Sub Category
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Sub Category Table <span className="text-sm text-gray-500 ml-2">{subCategories.length}</span>
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
              <Button
                onClick={() => { }}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Search
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px]">SL</TableHead>
                  <TableHead>Main Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubCategories.map((subCategory, index) => (
                  <TableRow key={subCategory._id || subCategory.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{subCategory.category?.name || "N/A"}</TableCell>

                    <TableCell>{subCategory.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={subCategory.status}
                        onCheckedChange={() => toggleStatus(subCategory._id || subCategory.id, subCategory.status)}
                        className="data-[state=checked]:bg-teal-500"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-blue-500 text-blue-500"
                          onClick={() => {
                            setNewSubCategory({
                              categoryId: subCategory.category?._id || "",
                              name: subCategory.name,
                              status: subCategory.status,
                            })
                            setEditingId(subCategory._id)
                            setIsEditMode(true)
                            setIsAddDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-red-500 text-red-500"
                          onClick={() => handleDelete(subCategory._id || subCategory.id)}
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Sub Category</DialogTitle>
            <DialogDescription>Create a new sub category for your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Main Category</Label>
              <Select
                value={newSubCategory.categoryId}
                onValueChange={(value) => setNewSubCategory({ ...newSubCategory, categoryId: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id || category.id} value={category._id || category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Sub Category Name</Label>
              <Input
                id="name"
                value={newSubCategory.name}
                onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                placeholder="e.g. Women's Care"
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newSubCategory.status}
                  onCheckedChange={(checked) => setNewSubCategory({ ...newSubCategory, status: checked })}
                  className="data-[state=checked]:bg-teal-500"
                />
                <Label>{newSubCategory.status ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubCategory} className="bg-teal-600 hover:bg-teal-700">
              {isEditMode ? "Update Sub Category" : "Add Sub Category"}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
