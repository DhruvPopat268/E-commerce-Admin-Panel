"use client"

import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Search, ChevronDown, Check } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
}

interface Subcategory {
  _id: string;
  name: string;
  category: {
    _id: string;
    name: string;
  };
}

interface AttributeOption {
  _id: string;
  name: string;
}

interface AttributeItem extends AttributeOption {
  price: string;
  discountedPrice: string;
}

// Searchable Select Component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "---Select---",
  disabled = false,
  searchPlaceholder = "Search...",
  className = "",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Get selected option display text
  const selectedOption = options.find(option => option._id === value);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm text-sm
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option._id}
                  type="button"
                  onClick={() => handleSelect(option._id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50
                    ${value === option._id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
                  `}
                >
                  <span>{option.name}</span>
                  {value === option._id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    visibility: true,
    image: "",
  });

  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeItem[]>([]);
  const [currentAttribute, setCurrentAttribute] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fetchedCategories, setFetchedCategories] = useState<Category[]>([]);
  const [fetchedSubcategories, setFetchedSubcategories] = useState<Subcategory[]>([]);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [filterSubCate, setFilterSubCate] = useState([])

  // Filtered subcategories based on selected category
const filteredSubcategories = useMemo(() => {
  if (!selectedCategory) return [];
  return fetchedSubcategories.filter((subcat) => subcat.category?._id === selectedCategory);
}, [fetchedSubcategories, selectedCategory]);

  // Update your useEffect for data fetching
  useEffect(() => {

    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all necessary data in parallel
        // Update your API call to fetch all subcategories
        const [attrRes, categoriesRes, subcategoriesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/attributes`),
          axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`),
          // Add query parameter to get all records (adjust based on your API)
          axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/subcategories?limit=1000`) // or ?all=true
        ]);

        setFetchedCategories(categoriesRes.data?.data)
        setFetchedSubcategories(subcategoriesRes.data[0].data)
        // FIX: Handle the nested response structure for subcategories
        let subcategoriesData = [];
        if (Array.isArray(subcategoriesRes.data)) {
          // If it's directly an array
          subcategoriesData = subcategoriesRes.data;
        } else if (subcategoriesRes.data && Array.isArray(subcategoriesRes.data.data)) {
          // If it's nested under 'data' property
          subcategoriesData = subcategoriesRes.data.data;
        } else if (subcategoriesRes.data && subcategoriesRes.data[0] && Array.isArray(subcategoriesRes.data[0].data)) {
          // If it's nested in an array under 'data' property (based on your API response)
          subcategoriesData = subcategoriesRes.data[0].data;
        }

        // Add safety checks and ensure arrays
        setAttributeOptions(Array.isArray(attrRes.data) ? attrRes.data : []);

        // If we're in edit mode, fetch the product data
        if (productId) {
          const productRes = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${productId}`);
          const productData = productRes.data;

          // Set the product state first
          setProduct({
            name: productData.name || "",
            description: productData.description || "",
            category: productData.category?._id || productData.category || "",
            subCategory: productData.subCategory?._id || productData.subCategory || "",
            visibility: productData.visibility ?? true,
            image: productData.image || "",
          });

          setPreviewImage(productData.image || null);
          setTags(Array.isArray(productData.tags) ? productData.tags : []);

          // Now set the selected category and subcategory
          if (productData.category) {
            const categoryId = productData.category._id || productData.category;
            setSelectedCategory(categoryId);

            // If subcategory exists, set it after a small delay to ensure category is set
            if (productData.subCategory) {
              setTimeout(() => {
                setSelectedSubCategory(productData.subCategory._id || productData.subCategory);
              }, 100);
            }
          }

          if (productData.attributes && Array.isArray(productData.attributes)) {
            const attrs = productData.attributes.map((attr: any) => ({
              _id: attr._id || "",
              name: attr.name,
              price: attr.price.toString(),
              discountedPrice: attr.discountedPrice.toString(),
            }));
            setSelectedAttributes(attrs);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load product data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [productId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file); // Save the file for submission
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

const handleCategoryChange = async (value: string) => {
  console.log("Selected category:", value);
  console.log("fetched subcategories:", fetchedSubcategories);
  setProduct({ ...product, category: value, subCategory: "" });
  setSelectedCategory(value);
  setSelectedSubCategory(null);
};

const handleSubCategoryChange = (value: string) => {
  setProduct({ ...product, subCategory: value });
  setSelectedSubCategory(value);
};

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAttributeSelect = (name: string) => {
    const attr = attributeOptions.find(a => a.name === name);
    if (attr && !selectedAttributes.some(a => a.name === name)) {
      setSelectedAttributes([...selectedAttributes, { ...attr, price: "", discountedPrice: "" }]);
      setCurrentAttribute("");
    }
  };

  const removeAttribute = (name: string) => {
    setSelectedAttributes(selectedAttributes.filter(a => a.name !== name));
  };

  const updateAttributeValues = (
    name: string,
    field: "price" | "discountedPrice",
    value: string
  ) => {
    setSelectedAttributes(prev =>
      prev.map(attr => attr.name === name ? { ...attr, [field]: value } : attr)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (productId) {
        // UPDATE EXISTING PRODUCT
        if (imageFile) {
          // If new image is selected, use FormData for update
          const formData = new FormData();
          formData.append("name", product.name);
          formData.append("description", product.description);
          formData.append("category", product.category);
          formData.append("subCategory", product.subCategory); // Fixed field name
          formData.append("visibility", product.visibility.toString());
          formData.append("image", imageFile);
          formData.append("tags", JSON.stringify(tags));
          formData.append("attributes", JSON.stringify(selectedAttributes));

          await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${productId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          // Update without new image
          const updatedProduct = {
            name: product.name,
            description: product.description,
            category: product.category,
            subCategory: product.subCategory, // Fixed field name
            visibility: product.visibility,
            tags,
            attributes: selectedAttributes,
            // Keep existing image
            image: product.image
          };

          await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${productId}`, updatedProduct);
        }
      } else {
        // CREATE NEW PRODUCT
        if (!imageFile) {
          setError("Please select an image for the product.");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("description", product.description);
        formData.append("category", product.category);
        formData.append("subCategory", product.subCategory); // Fixed field name
        formData.append("visibility", product.visibility.toString()); // Fixed field name
        formData.append("image", imageFile);
        formData.append("tags", JSON.stringify(tags));
        formData.append("attributes", JSON.stringify(selectedAttributes));

        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }

        await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      router.push("/dashboard/products");
    } catch (err) {
      console.error("Save failed:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to save product. Please try again.");
      } else {
        setError("Failed to save product. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Package className="h-8 w-8 text-amber-600" />
        <h2 className="text-3xl font-bold tracking-tight">
          {productId ? "Edit Product" : "Add New Product"}
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

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
                  <SearchableSelect
                    options={fetchedCategories}
                    value={product.category}
                    onChange={handleCategoryChange}
                    placeholder="---Select---"
                    searchPlaceholder="Search categories..."
                    className="border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Sub Category</Label>
                  <SearchableSelect
                    options={filteredSubcategories}
                    value={product.subCategory}
                    onChange={handleSubCategoryChange}
                    disabled={!selectedCategory}
                    placeholder="---Select---"
                    searchPlaceholder="Search subcategories..."
                    className="border-gray-300"
                  />
                </div>
              </div>
              <div className="">
                <div className="mt-5 relative top-11 text-sm text-gray-600">
                  Turning Visibility off will not show this product in the user app and website
                </div>
                <div className="flex items-center">
                  <span className="font-medium relative top-14">Visibility</span>
                  <Switch
                    checked={product.visibility}
                    onCheckedChange={(checked) => setProduct({ ...product, visibility: checked })}
                    className="data-[state=checked]:bg-teal-500 relative top-14 ml-3"
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
                    onClick={() => {
                      setPreviewImage(null);
                      setImageFile(null);
                      // Reset the file input
                      const fileInput = document.getElementById('product-image') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
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
                    required={!productId} // Only require image for new products
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

        {/* Attributes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
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
                        <SelectItem key={attr._id} value={attr.name}>
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
                          type="number"
                        />
                        <Input
                          placeholder="Enter Price After Discount"
                          value={attr.discountedPrice}
                          onChange={(e) => updateAttributeValues(attr.name, 'discountedPrice', e.target.value)}
                          className="border-gray-300"
                          type="number"
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
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/products")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (productId ? "Update Product" : "Add Product")}
          </Button>
        </div>
      </form>
    </div>
  );
}