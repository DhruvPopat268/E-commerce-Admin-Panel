"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Search, Download, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import axios from "axios"

interface Village {
  id: string
  name: string
  checked: boolean
}

interface Customer {
  id: number
  name: string
  villages: string[]
  status: boolean
  // Add other fields that might come from the API
  village?: string // Single village field if API returns it this way
  email?: string
  phone?: string
  // Add more fields as needed based on your API response
}

interface SalesAgent {
  id: number
  name: string
  village: string // Assuming the API returns village as a string
  // Add other fields that might come from salesAgents API
  email?: string
  phone?: string
  status?: boolean
  // Add more fields as needed
}

export default function RouteSetupPage() {
  const params = useParams()
  const routeId = params.id

  const [villages, setVillages] = useState<Village[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState<string | null>(null)

  // Updated customers state - will be populated from API
  const [customers, setCustomers] = useState<Customer[]>([])
  const [allSalesAgents, setAllSalesAgents] = useState<SalesAgent[]>([])

  const [selectAll, setSelectAll] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setIsMounted(true)
    fetchVillages()
    fetchAllSalesAgents()
  }, [])

  const fetchVillages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/villages`)
      
      console.log('Villages API Response:', response.data)
      
      let villagesData = response.data
      
      if (response.data && response.data.data) {
        villagesData = response.data.data
      }
      
      if (response.data && response.data.villages) {
        villagesData = response.data.villages
      }
      
      if (!Array.isArray(villagesData)) {
        throw new Error('API response is not an array')
      }
      
      const fetchedVillages = villagesData.map((village: any) => ({
        id: (village.id || village._id || Math.random().toString()).toString(),
        name: village.name || village.village_name || village.title || 'Unknown Village',
        checked: false
      }))
      
      setVillages(fetchedVillages)
    } catch (error) {
      console.error('Error fetching villages:', error)
      setError('Failed to fetch villages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllSalesAgents = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents`)
      console.log('Sales Agents API Response:', response.data)
      
      let salesAgentsData = response.data
      
      // Handle different API response structures
      if (response.data && response.data.data) {
        salesAgentsData = response.data.data
      }
      
      if (response.data && response.data.salesAgents) {
        salesAgentsData = response.data.salesAgents
      }
      
      if (!Array.isArray(salesAgentsData)) {
        throw new Error('Sales agents API response is not an array')
      }
      
      setAllSalesAgents(salesAgentsData)
    } catch (error) {
      console.error('Error fetching sales agents:', error)
      // Don't set error state here as it's not critical for initial load
    }
  }

  const fetchCustomersBySelectedVillages = async (selectedVillageNames: string[]) => {
    try {
      setCustomersLoading(true)
      setCustomersError(null)
      
      // Filter sales agents by selected villages
      const filteredCustomers = allSalesAgents.filter(agent => {
        // Check if agent's village matches any of the selected villages
        return selectedVillageNames.some(villageName => 
          agent.village && agent.village.toLowerCase().includes(villageName.toLowerCase())
        )
      })

      // Transform sales agents to customer format
      const transformedCustomers: Customer[] = filteredCustomers.map((agent, index) => ({
        id: agent.id,
        name: agent.name,
        villages: [agent.village], // Convert single village to array
        status: agent.status !== undefined ? agent.status : true,
        // Include other fields if needed
        email: agent.email,
        phone: agent.phone
      }))

      setCustomers(transformedCustomers)
    } catch (error) {
      console.error('Error filtering customers:', error)
      setCustomersError('Failed to load customers for selected villages.')
    } finally {
      setCustomersLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setVillages(villages.map((village) => ({ ...village, checked })))
  }

  const handleVillageChange = (villageId: string, checked: boolean) => {
    setVillages(villages.map((village) => (village.id === villageId ? { ...village, checked } : village)))

    const updatedVillages = villages.map((village) => (village.id === villageId ? { ...village, checked } : village))
    setSelectAll(updatedVillages.every((village) => village.checked))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedVillages = villages.filter((village) => village.checked)
    
    if (selectedVillages.length === 0) {
      alert('Please select at least one village.')
      return
    }
    
    console.log("Selected villages:", selectedVillages)
    
    // Get selected village names
    const selectedVillageNames = selectedVillages.map(village => village.name)
    
    // Fetch customers for selected villages
    await fetchCustomersBySelectedVillages(selectedVillageNames)
  }

  const handleReset = () => {
    setVillages(villages.map((village) => ({ ...village, checked: false })))
    setSelectAll(false)
    setCustomers([]) // Clear customers table
    setCustomersError(null)
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/routes/setup">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-semibold">🛣️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Routes Setup</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Villages in Route :</label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectAll} 
                  onCheckedChange={handleSelectAll}
                  disabled={loading || villages.length === 0}
                />
                <label htmlFor="select-all" className="text-sm text-gray-600">
                  Select All
                </label>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading villages...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 text-sm">{error}</div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchVillages}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}

            {!loading && !error && villages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No villages found
              </div>
            )}

            {!loading && !error && villages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {villages.map((village) => (
                  <div key={village.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={village.id}
                      checked={village.checked}
                      onCheckedChange={(checked) => handleVillageChange(village.id, checked as boolean)}
                    />
                    <label htmlFor={village.id} className="text-sm text-gray-600">
                      {village.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={loading || villages.length === 0}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={loading || villages.length === 0 || customersLoading}
            >
              {customersLoading ? 'Loading...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Customers Table</h2>
              <Badge variant="secondary">{filteredCustomers.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Customer Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                />
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" className="text-teal-600 border-teal-600 hover:bg-teal-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {customersLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading customers...</div>
            </div>
          )}

          {customersError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
              <div className="text-red-700 text-sm">{customersError}</div>
            </div>
          )}

          {!customersLoading && !customersError && customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {villages.some(v => v.checked) ? 
                'No customers found for selected villages' : 
                'Please select villages and click Submit to load customers'
              }
            </div>
          )}

          {!customersLoading && !customersError && customers.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Villages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {customer.villages.map((village, idx) => (
                          <span key={idx} className="text-blue-600">
                            {village}
                            {idx < customer.villages.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch checked={customer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}