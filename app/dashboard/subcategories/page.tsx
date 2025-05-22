"use client"

import { useState } from "react"
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

// Sample data for categories
const categories = [
  { id: 1, name: "Personal Care" },
  { id: 2, name: "Cleaning" },
  { id: 3, name: "Health Care" },
  { id: 4, name: "Beverages" },
  { id: 5, name: "Breakfast" },
]

// Sample data for subcategories
const initialSubCategories = [
  { id: 1, category: "Personal Care", name: "Women's Care", status: true },
  { id: 2, category: "Cleaning", name: "Cleaning Supplies", status: true },
  { id: 3, category: "Health Care", name: "Antiseptics", status: true },
  { id: 4, category: "Beverages", name: "Soft Drinks", status: true },
  { id: 5, category: "Beverages", name: "Tea & Coffee", status: true },
  { id: 6, category: "Beverages", name: "Juice", status: true },
  { id: 7, category: "Breakfast", name: "Dairy", status: true },
]

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState(initialSubCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSubCategory, setNewSubCategory] = useState({ category: "", name: "", status: true })
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSubCategories = subCategories.filter(
    (subCategory) =>
      subCategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subCategory.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddSubCategory = () => {
    if (newSubCategory.name.trim() === "" || newSubCategory.category.trim() === "") return

    const newId = Math.max(0, ...subCategories.map((sc) => sc.id)) + 1
    setSubCategories([
      ...subCategories,
      {
        id: newId,
        category: newSubCategory.category,
        name: newSubCategory.name,
        status: newSubCategory.status,
      },
    ])

    setNewSubCategory({ category: "", name: "", status: true })
    setIsAddDialogOpen(false)
  }

  const toggleStatus = (id: number) => {
    setSubCategories(
      subCategories.map((subCategory) =>
        subCategory.id === id ? { ...subCategory, status: !subCategory.status } : subCategory,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sub Categories</h2>
          <p className="text-muted-foreground">Manage your product sub categories</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
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
                  <TableHead>Main Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubCategories.map((subCategory, index) => (
                  <TableRow key={subCategory.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{subCategory.category}</TableCell>
                    <TableCell>{subCategory.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={subCategory.status}
                        onCheckedChange={() => toggleStatus(subCategory.id)}
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
            <DialogTitle>Add New Sub Category</DialogTitle>
            <DialogDescription>Create a new sub category for your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Main Category</Label>
              <Select
                value={newSubCategory.category}
                onValueChange={(value) => setNewSubCategory({ ...newSubCategory, category: value })}
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
            <Button onClick={handleAddSubCategory} className="bg-teal-600 hover:bg-teal-700">
              Add Sub Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
