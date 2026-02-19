"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Image from 'next/image';

type ProductAttribute = {
  _id: string;
  name: string;
  price: number;
  discountedPrice: number;
};

type Product = {
  _id: string;
  name: string;
  images?: string[];
  attributes: ProductAttribute[];
  categoryName?: string;
  subcategoryName?: string;
};

type ProductSelectorProps = {
  onSelect: (productId: string, attributeId: string, productData: Product, attributeData: ProductAttribute) => void;
  disabled?: boolean;
};

export function ProductSelector({ onSelect, disabled }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search })
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.total || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    // If product has only 1 attribute, auto-select it
    if (product.attributes.length === 1) {
      onSelect(product._id, product.attributes[0]._id, product, product.attributes[0]);
    } else {
      setSelectedProduct(product);
    }
  };

  const handleAttributeSelect = (attributeId: string) => {
    if (selectedProduct) {
      const attribute = selectedProduct.attributes.find(attr => attr._id === attributeId);
      if (attribute) {
        onSelect(selectedProduct._id, attributeId, selectedProduct, attribute);
      }
      setSelectedProduct(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
            disabled={disabled}
          />
        </div>
      </div>

      {selectedProduct ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {selectedProduct.images?.[0] && (
              <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{selectedProduct.name}</h3>
              {selectedProduct.categoryName && (
                <p className="text-xs text-muted-foreground">{selectedProduct.categoryName}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
              Back
            </Button>
          </div>
          <Label>Select Attribute:</Label>
          <div className="grid gap-2">
            {selectedProduct.attributes.map((attr) => (
              <Button
                key={attr._id}
                variant="outline"
                className="justify-between h-auto py-3"
                onClick={() => handleAttributeSelect(attr._id)}
                disabled={disabled}
              >
                <span>{attr.name}</span>
                <span className="font-semibold">₹{attr.discountedPrice}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-3 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {products.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  disabled={disabled}
                  className="border rounded-lg p-4 hover:border-primary transition-colors text-left disabled:opacity-50"
                >
                  <div className="aspect-[3/4] relative mb-3 bg-gray-100 rounded overflow-hidden">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-xs line-clamp-2 text-center">{product.name}</p>
                  {product.categoryName && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1 text-center">{product.categoryName}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading || disabled}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading || disabled}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
