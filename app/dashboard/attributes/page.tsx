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
import { Settings } from "lucide-react"

// Sample data for attributes
const initialAttributes = [
  { id: 1, name: "BOX" },
  { id: 2, name: "CARTOON" },
  { id: 3, name: "PSC" },
]

export default function AttributesPage() {
  const [attributes, setAttributes] = useState(initialAttributes)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAttribute, setNewAttribute] = useState({ name: "" })
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAttributes = attributes.filter((attribute) =>
    attribute.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddAttribute = () => {
    if (newAttribute.name.trim() === "") return

    const newId = Math.max(0, ...attributes.map((c) => c.id)) + 1
    setAttributes([...attributes, { id: newId, name: newAttribute.name }])
    setNewAttribute({ name: "" })
    setIsAddDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="bg-yellow-400 p-2 rounded-full">
              <Settings className="h-6 w-6 text-white" />
            </span>
            Attribute Setup
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Attribute Table <span className="text-sm text-gray-500 ml-2">{attributes.length}</span>
            </h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search"
                  className="pl-10 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Attribute
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[100px]">SL</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttributes.map((attribute, index) => (
                  <TableRow key={attribute.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{attribute.name}</TableCell>
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
            <DialogTitle>Add New Attribute</DialogTitle>
            <DialogDescription>Create a new attribute for inventory items.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Attribute Name</Label>
              <Input
                id="name"
                value={newAttribute.name}
                onChange={(e) => setNewAttribute({ name: e.target.value })}
                placeholder="e.g. BOX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAttribute} className="bg-teal-600 hover:bg-teal-700">
              Add Attribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
