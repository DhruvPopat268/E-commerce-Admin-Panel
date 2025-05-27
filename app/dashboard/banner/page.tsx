"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Upload, Search } from "lucide-react"
import Image from "next/image"
import axios from 'axios'

interface Banner {
  _id: string; // MongoDB ID
  title: string;
  type: "Category" | "Subcategory";
  categoryId?: any; // Changed to any to handle populated objects
  categoryName?: string;
  subcategoryId?: any; // Changed to any to handle populated objects
  subcategoryName?: string;
  image: string;
  status: boolean;
  createdAt: string;
}

interface Category {
  _id: string; // Fixed: using _id instead of id
  name: string
}

interface Subcategory {
  _id: string; // Fixed: using _id instead of id
  name: string
  categoryId: number
}

export default function BannersPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({
    title: "",
    type: "",
    categoryId: "",
    subcategoryId: "",
    image: null as File | null,
  })

  const [imagePreview, setImagePreview] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners`);
        console.log("banners are", res.data);
        setBanners(res.data);
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      } finally {
        setLoading(false);
      }
    };


    const fetchCategories = async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`)
      console.log('categories', res.data)
      setCategories(res.data)
    }

    const fetchSubCategories = async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subcategories`)
      console.log('subcategories', res.data)
      setSubcategories(res.data)
    }

    fetchData();
    fetchCategories();
    fetchSubCategories()
  },[])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Reset category/subcategory selection when type changes
    if (field === "type") {
      setFormData((prev) => ({
        ...prev,
        categoryId: "",
        subcategoryId: "",
      }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }))

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.type || (!formData.image && !editId)) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.type === "Category" && !formData.categoryId) {
      alert("Please select a category");
      return;
    }

    if (formData.type === "Subcategory" && !formData.subcategoryId) {
      alert("Please select a subcategory");
      return;
    }

    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("type", formData.type);
    if (formData.categoryId) postData.append("categoryId", formData.categoryId);
    if (formData.subcategoryId) postData.append("subcategoryId", formData.subcategoryId);
    if (formData.image) postData.append("image", formData.image);

    try {
      let response;

      if (editId) {
        // Edit (PUT request)
        response = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners/${editId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          setBanners((prev) =>
            prev.map((banner) =>
              banner._id === editId ? response.data.data : banner
            )
          );
          alert("Banner updated successfully!");
        }
      } else {
        // Create (POST request)
        response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          setBanners((prev) => [response.data.data, ...prev]);
          alert("Banner created successfully!");
        }
      }

      // Reset form and editId
      setFormData({
        title: "",
        type: "",
        categoryId: "",
        subcategoryId: "",
        image: null,
      });
      setImagePreview("");
      setEditId(null);

      const fileInput = document.getElementById("banner-image") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("❌ Error submitting banner:", error);
      alert("Failed to submit banner");
    }
  };

  const handleReset = () => {
    setFormData({
      title: "",
      type: "",
      categoryId: "",
      subcategoryId: "",
      image: null,
    })
    setImagePreview("")

    const fileInput = document.getElementById("banner-image") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  // Fixed toggle function - using string ID and making API call
  const toggleStatus = async (id: string) => {
    try {
      // Make API call to toggle status using your specific toggle route
      const response = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners/toggle/${id}`);

      // Your backend returns the updated banner directly
      if (response.data) {
        // Update local state with the returned banner data
        setBanners((prev) =>
          prev.map((banner) =>
            banner._id === id ? { ...banner, status: response.data.status } : banner
          )
        );
        console.log(`Banner status updated to: ${response.data.status}`);
      } else {
        console.error('Failed to update banner status:', response.data);
        alert('Failed to update banner status');
      }
    } catch (error: any) {
      console.error('Error updating banner status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error updating banner status';
      alert(`Error updating banner status: ${errorMessage}`);
    }
  };

  const deleteBanner = async (id: string) => {
    // Add validation
    if (!id || typeof id !== 'string') {
      console.error('Invalid ID:', id);
      alert('Invalid banner ID');
      return;
    }

    // Add confirmation dialog
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    console.log('Deleting banner with ID:', id);

    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners/${id}`);

      console.log('Delete response:', response.data);

      if (response.data.success) {
        setBanners(prev => prev.filter(banner => banner._id !== id));
        alert('Banner deleted successfully');
      } else {
        console.error('Delete failed:', response.data);
        alert(response.data.error || 'Failed to delete banner');
      }
    } catch (error: any) {
      console.error('Delete error full details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      const errorMessage = error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        'Error deleting banner';

      alert(`Error deleting banner: ${errorMessage}`);
    }
  };

  const updateBanner = async (id: string, updatedData: any) => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners/${id}`, updatedData);
      if (response.data.success) {
        setBanners((prev) =>
          prev.map((banner) => (banner._id === id ? response.data.data : banner))
        );
      }
    } catch (error) {
      console.error('Error updating banner:', error);
    }
  };

  const filteredBanners = banners.filter(
    (banner) =>
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner._id.toString().includes(searchTerm)
  )

  const handleEdit = (banner: Banner) => {
    setEditId(banner._id);
    setFormData({
      title: banner.title || "",
      type: banner.type || "",
      categoryId: banner.categoryId ? String(banner.categoryId) : "",
      subcategoryId: banner.subcategoryId ? String(banner.subcategoryId) : "",
      image: null,
    });
    setImagePreview(banner.image);
  };

  // Helper function to get category/subcategory name
  const getCategorySubcategoryName = (banner: Banner) => {
    if (banner.type === "Category") {
      // Handle both populated object and ID cases
      if (typeof banner.categoryId === 'object' && banner.categoryId?.name) {
        return banner.categoryId.name;
      }
      // If it's just an ID, find the name from categories array
      const category = categories.find(cat => cat._id === banner.categoryId);
      return category?.name || 'Unknown Category';
    } else {
      // Handle subcategory
      if (typeof banner.subcategoryId === 'object' && banner.subcategoryId?.name) {
        return banner.subcategoryId.name;
      }
      // If it's just an ID, find the name from subcategories array
      const subcategory = subcategories.find(sub => sub._id === banner.subcategoryId);
      return subcategory?.name || 'Unknown Subcategory';
    }
  };

 if (loading) {
  return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
    </div>
  )
}

  return (
    <div className="space-y-6">
      {/* Banner Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            Banner Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="New banner"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Category">Category</SelectItem>
                    <SelectItem value="Subcategory">Subcategory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Category/Subcategory Dropdown */}
              {formData.type === "Category" && (
                <div>
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === "Subcategory" && (
                <div>
                  <Label htmlFor="subcategory">
                    Subcategory <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.subcategoryId}
                    onValueChange={(value) => handleInputChange("subcategoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory._id} value={subcategory._id.toString()}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="banner-image">
                  Banner Image <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500 ml-1">( Ratio 2:1 )</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Banner preview"
                        width={200}
                        height={100}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("banner-image")?.click()}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="text-gray-600">Upload Image</div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("banner-image")?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                  <input
                    id="banner-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                {editId ? "Update Banner" : "Add Banner"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Banner List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Banner List</CardTitle>
              <Badge variant="secondary">{filteredBanners.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by ID or name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700">Search</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL</TableHead>
                <TableHead>Banner Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category / Subcategory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanners.map((banner, index) => (
                <TableRow key={banner._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}/uploads/${banner.image}` || "/placeholder.svg"}
                      alt={banner.title}
                      width={80}
                      height={40}
                      className="rounded object-cover"
                    />
                  </TableCell>
                  <TableCell>{banner.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{banner.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {getCategorySubcategoryName(banner)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.status}
                      onCheckedChange={() => toggleStatus(banner._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Deleting banner with ID:', banner._id);
                          deleteBanner(banner._id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}