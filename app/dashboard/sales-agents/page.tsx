"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Image from "next/image"
import { Search, Plus, Pencil, Trash2, Download, UserCheck, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SalesAgent {
    _id: string
    name: string
    businessName: string
    mobileNumber: string
    address: string
    village: string
    photo: {
        public_id?: string
        url?: string
    }
    status: boolean
    createdAt: string
    updatedAt: string
}

interface Village {
    _id: string
    name: string
    // Add other village properties if needed
}

interface ApiResponse {
    success: boolean
    data: SalesAgent[]
    message?: string
    pagination?: {
        current: number
        total: number
        count: number
        totalRecords: number
    }
}

interface VillageApiResponse {
    success: boolean
    data: Village[]
    message?: string
}

export default function SalesAgentPage() {
    const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([])
    const [villages, setVillages] = useState<Village[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingAgentId, setEditingAgentId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [villagesLoading, setVillagesLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    const [newAgent, setNewAgent] = useState({
        name: "",
        businessName: "",
        mobileNumber: "",
        address: "",
        village: "",
    })
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    const fetchVillages = async () => {
        try {
            setVillagesLoading(true)
            const { data } = await axios.get<VillageApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/villages`)
            
            if (data.success) {
                setVillages(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.message || 'Failed to fetch villages',
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: 'Failed to fetch villages',
                variant: "destructive",
            })
        } finally {
            setVillagesLoading(false)
        }
    }

    const fetchSalesAgents = async () => {
        try {
            setLoading(true)
            setError(null)

            const queryParams = new URLSearchParams()
            if (searchTerm) queryParams.append('search', searchTerm)

            const { data } = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents?${queryParams}`)

            if (data.success) {
                setSalesAgents(data.data)
            } else {
                setError(data.message || 'Failed to fetch sales agents')
                toast({
                    title: "Error",
                    description: data.message || 'Failed to fetch sales agents',
                    variant: "destructive",
                })
            }
        } catch (error) {
            setError('Network error occurred')
            toast({
                title: "Error",
                description: 'Network error occurred',
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVillages()
    }, [])

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchSalesAgents()
        }, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchTerm])

    const handleAddAgent = async () => {
        if (!newAgent.name || !newAgent.businessName || !newAgent.mobileNumber || !newAgent.address || !newAgent.village) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitLoading(true)
            const formData = new FormData()
            Object.entries(newAgent).forEach(([key, value]) => formData.append(key, value))
            if (photoFile) formData.append('photo', photoFile)

            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents`, formData)
             
            if (data.success) {
                toast({ title: "Success", description: "Sales agent created successfully" })
                resetForm()
                setIsDialogOpen(false)
                fetchSalesAgents()
            } else {
                toast({
                    title: "Error",
                    description: data.message || 'Failed to create sales agent',
                    variant: "destructive",
                })
            }
        } catch {
            toast({
                title: "Error",
                description: 'Network error occurred',
                variant: "destructive",
            })
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleEditAgent = async () => {
        if (!editingAgentId) return

        try {
            setSubmitLoading(true)
            const formData = new FormData()
            Object.entries(newAgent).forEach(([key, value]) => formData.append(key, value))
            if (photoFile) formData.append('photo', photoFile)

            const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents/${editingAgentId}`, formData)

            if (data.success) {
                toast({ title: "Success", description: "Sales agent updated successfully" })
                resetForm()
                setIsDialogOpen(false)
                fetchSalesAgents()
            } else {
                toast({
                    title: "Error",
                    description: data.message || 'Failed to update sales agent',
                    variant: "destructive",
                })
            }
        } catch {
            toast({
                title: "Error",
                description: 'Network error occurred',
                variant: "destructive",
            })
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents/${id}/status`, {
                status: !currentStatus
            })

            if (data.success) {
                toast({
                    title: "Success",
                    description: `Sales agent status ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
                })
                fetchSalesAgents()
            } else {
                toast({
                    title: "Error",
                    description: data.message || 'Failed to update status',
                    variant: "destructive",
                })
            }
        } catch {
            toast({
                title: "Error",
                description: 'Network error occurred',
                variant: "destructive",
            })
        }
    }

    const handleDeleteAgent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sales agent?')) return

        try {
            const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents/${id}`)

            if (data.success) {
                toast({ title: "Success", description: "Sales agent deleted successfully" })
                fetchSalesAgents()
            } else {
                toast({
                    title: "Error",
                    description: data.message || 'Failed to delete sales agent',
                    variant: "destructive",
                })
            }
        } catch {
            toast({
                title: "Error",
                description: 'Network error occurred',
                variant: "destructive",
            })
        }
    }

    const handleExport = async () => {
        try {
            const { data } = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents?limit=1000`)
            if (data.success) {
                const csvContent = [
                    ['Name', 'Business Name', 'Mobile Number', 'Address', 'Village', 'Status', 'Created At'].join(','),
                    ...data.data.map(agent => [
                        agent.name,
                        agent.businessName,
                        agent.mobileNumber,
                        agent.address,
                        agent.village,
                        agent.status ? 'Active' : 'Inactive',
                        new Date(agent.createdAt).toLocaleDateString()
                    ].join(','))
                ].join('\n')

                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `sales-agents-${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)

                toast({ title: "Success", description: "Sales agents data exported successfully" })
            }
        } catch {
            toast({
                title: "Error",
                description: 'Failed to export data',
                variant: "destructive",
            })
        }
    }

    const resetForm = () => {
        setNewAgent({
            name: "",
            businessName: "",
            mobileNumber: "",
            address: "",
            village: "",
        })
        setPhotoFile(null)
        setPhotoPreview(null)
        setIsEditMode(false)
        setEditingAgentId(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setNewAgent({ ...newAgent, [name]: value })
    }

    const handleVillageChange = (value: string) => {
        setNewAgent({ ...newAgent, village: value })
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setPhotoPreview(event.target.result as string)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const handleEditClick = (agent: SalesAgent) => {
        setIsEditMode(true)
        setEditingAgentId(agent._id)
        setNewAgent({
            name: agent.name,
            businessName: agent.businessName,
            mobileNumber: agent.mobileNumber,
            address: agent.address,
            village: agent.village,
        })
        if (agent.photo?.url) setPhotoPreview(agent.photo.url)
        setIsDialogOpen(true)
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            resetForm()
        }
        setIsDialogOpen(open)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <UserCheck className="h-8 w-8" />
                    Customer List
                    <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
                        {salesAgents.length}
                    </span>
                </h2>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {isEditMode ? 'Edit Sales Agent' : 'Add New Sales Agent'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative h-24 w-24 overflow-hidden rounded-full border">
                                    {photoPreview ? (
                                        <Image
                                            src={photoPreview}
                                            alt="Agent photo preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                            No Photo
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="photo" className="cursor-pointer text-sm font-medium text-blue-600">
                                        Upload Photo
                                    </Label>
                                    <Input
                                        id="photo"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Enter name"
                                        value={newAgent.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name *</Label>
                                    <Input
                                        id="businessName"
                                        name="businessName"
                                        placeholder="Enter business name"
                                        value={newAgent.businessName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                                    <Input
                                        id="mobileNumber"
                                        name="mobileNumber"
                                        placeholder="Enter mobile number"
                                        value={newAgent.mobileNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="village">Village *</Label>
                                    <Select value={newAgent.village} onValueChange={handleVillageChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={villagesLoading ? "Loading villages..." : "Select village"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {villagesLoading ? (
                                                <SelectItem value="" disabled>
                                                    <div className="flex items-center">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading villages...
                                                    </div>
                                                </SelectItem>
                                            ) : villages.length === 0 ? (
                                                <SelectItem value="" disabled>
                                                    No villages found
                                                </SelectItem>
                                            ) : (
                                                villages.map((village) => (
                                                    <SelectItem key={village._id} value={village.name}>
                                                        {village.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        placeholder="Enter address"
                                        value={newAgent.address}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => handleDialogClose(false)} disabled={submitLoading}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={isEditMode ? handleEditAgent : handleAddAgent}
                                    disabled={submitLoading}
                                >
                                    {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? 'Update' : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name, Phone, Business or Village"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">SL</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Business Info</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <p className="mt-2 text-muted-foreground">Loading sales agents...</p>
                                </TableCell>
                            </TableRow>
                        ) : salesAgents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No sales agents found
                                </TableCell>
                            </TableRow>
                        ) : (
                            salesAgents.map((agent, index) => (
                                <TableRow key={agent._id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 relative overflow-hidden rounded-full">
                                                <Image
                                                    src={agent.photo?.url}
                                                    alt={agent.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="font-medium">{agent.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="text-sm">{agent.mobileNumber}</div>
                                            <div className="text-xs text-muted-foreground">{agent.address}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="text-sm">{agent.businessName}</div>
                                            <div className="text-xs text-muted-foreground">Village: {agent.village}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={agent.status}
                                            onCheckedChange={() => handleToggleStatus(agent._id, agent.status)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEditClick(agent)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteAgent(agent._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}