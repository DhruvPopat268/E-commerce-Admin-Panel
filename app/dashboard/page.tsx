"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, Package, ShoppingBag, Trash2, Users, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SearchableSelect, type Option } from "@/components/searchable-select"
import Link from 'next/link';

type ProductRow = {
  productId: string
  attributeId: string
  quantity: number
}

type Customer = {
  _id: string
  id?: string
  name?: string
  salesAgentName?: string
  firstName?: string
  lastName?: string
  email?: string
  mobileNumber?: string
  villageName?: string
  villageCode?: string
}

type ProductAttribute = {
  _id: string
  name: string
  price: number
  discountedPrice: number
}

type Product = {
  _id: string
  id?: string
  name?: string
  productName?: string
  description?: string
  price?: number
  categoryId?: string
  images?: string[]
  attributes: ProductAttribute[]
}

export default function DashboardPage() {
  // Existing dashboard state
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Place order state
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [fulfillment, setFulfillment] = useState<"takeaway" | "delivery" | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrderData, setLoadingOrderData] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    fetchOrderFormData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all data in parallel
      const [
        categoriesRes,
        productsRes,
        customersRes,
        pendingOrdersRes,
        cancelledOrdersRes
      ] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/categories`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/pending`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/cancelled`)
      ]);

      const [
        categoriesData,
        productsData,
        customersData,
        pendingOrdersData,
        cancelledOrdersData
      ] = await Promise.all([
        categoriesRes.json(),
        productsRes.json(),
        customersRes.json(),
        pendingOrdersRes.json(),
        cancelledOrdersRes.json()
      ]);

      // Update stats
      setStats({
        totalCategories: categoriesData.pagination?.totalRecords || categoriesData?.categories?.length || 0,
        totalProducts: productsData?.pagination?.totalRecords || productsData?.products?.length || 0,
        totalCustomers: customersData?.pagination?.totalRecords || customersData?.salesAgents?.length || 0
      });

      // Set recent orders
      setRecentOrders(pendingOrdersData?.pendingOrders?.slice(0, 4) || []);
      setCancelledOrders(cancelledOrdersData?.cancelledOrders?.slice(0, 4) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderFormData = async () => {
    try {
      setLoadingOrderData(true);

      // Fetch customers and products for the order form
      const [customersRes, productsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/salesAgents`),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`)
      ]);

      // Check if requests were successful
      if (!customersRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch order form data');
      }

      const [customersData, productsData] = await Promise.all([
        customersRes.json(),
        productsRes.json()
      ]);

      console.log('Customers data:', customersData);
      console.log('Products data:', productsData);

      // Extract data based on different possible response structures
      setCustomers(
        customersData?.salesAgents ||
        customersData?.data ||
        customersData?.customers ||
        (Array.isArray(customersData) ? customersData : [])
      );

      setProducts(
        productsData?.products ||
        productsData?.data ||
        (Array.isArray(productsData) ? productsData : [])
      );

    } catch (error) {
      console.error('Error fetching order form data:', error);
      toast({
        title: "Error",
        description: "Failed to load order form data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoadingOrderData(false);
    }
  };

  // Helper function to get customer display name
  const getCustomerDisplayName = (customer: Customer): string => {
    if (customer.salesAgentName) return customer.salesAgentName;
    if (customer.name) return customer.name;
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    }
    if (customer.firstName) return customer.firstName;
    if (customer.email) return customer.email;
    return `Customer ${customer._id || customer.id}`;
  };

  // Helper function to get product display name
  const getProductDisplayName = (product: Product): string => {
    return product.productName || product.name || `Product ${product._id || product.id}`;
  };

  // Memoized options for select components
  const customerOptions: Option[] = useMemo(() =>
    customers.map((customer: Customer) => ({
      value: customer._id || customer.id || '',
      label: getCustomerDisplayName(customer)
    })), [customers]
  );

  const productOptions: Option[] = useMemo(() =>
    products.map((product: Product) => ({
      value: product._id || product.id || '',
      label: getProductDisplayName(product)
    })), [products]
  );

  // Get attributes for a specific product only
  function attributeOptionsForProduct(productId?: string | null): Option[] {
    if (!productId) {
      return [{ value: 'default', label: 'Select product first' }];
    }

    const product = products.find(p => (p._id || p.id) === productId);
    
    if (!product || !product.attributes || product.attributes.length === 0) {
      return [{ value: 'default', label: 'No attributes available' }];
    }

    // Return only the attributes for this specific product
    return product.attributes.map((attr: ProductAttribute) => ({
      value: attr._id,
      label: `${attr.name} - ₹${attr.discountedPrice}`
    }));
  }

  // Calculate subtotal for a product row
  const getRowSubtotal = (row: ProductRow): number => {
    if (!row.productId || !row.attributeId) return 0;
    
    const product = products.find(p => (p._id || p.id) === row.productId);
    if (!product || !product.attributes) return 0;

    const attribute = product.attributes.find(attr => attr._id === row.attributeId);
    if (!attribute) return 0;

    return attribute.discountedPrice * row.quantity;
  };

  // Calculate total amount for all products
  const orderTotal = useMemo(() => {
    return productRows.reduce((total, row) => total + getRowSubtotal(row), 0);
  }, [productRows, products]);

  const isValid =
    !!selectedCustomer &&
    !!fulfillment &&
    productRows.length > 0 &&
    productRows.every((r) => !!r.productId && !!r.attributeId && Number.isFinite(r.quantity) && r.quantity > 0);

  const totalItems = useMemo(
    () => productRows.reduce((sum, r) => sum + (Number.isFinite(r.quantity) ? r.quantity : 0), 0),
    [productRows],
  );

  function resetForm() {
    setSelectedCustomer(null);
    setProductRows([]);
    setFulfillment(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function addProductRow() {
    setProductRows((rows) => [...rows, { productId: "", attributeId: "", quantity: 1 }]);
  }

  function removeProductRow(index: number) {
    setProductRows((rows) => rows.filter((_, i) => i !== index));
  }

  function updateRowProduct(index: number, productId: string) {
    setProductRows((rows) => rows.map((r, i) => (i === index ? { ...r, productId, attributeId: "" } : r)));
  }

  function updateRowAttribute(index: number, attributeId: string) {
    setProductRows((rows) => rows.map((r, i) => (i === index ? { ...r, attributeId } : r)));
  }

  function setRowQuantity(index: number, quantity: number) {
    const q = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    setProductRows((rows) => rows.map((r, i) => (i === index ? { ...r, quantity: q } : r)));
  }

  function incRowQty(index: number) {
    setProductRows((rows) => rows.map((r, i) => (i === index ? { ...r, quantity: r.quantity + 1 } : r)));
  }

  function decRowQty(index: number) {
    setProductRows((rows) => rows.map((r, i) => (i === index ? { ...r, quantity: Math.max(1, r.quantity - 1) } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || placingOrder) return;

    try {
      setPlacingOrder(true);

      // Find the selected customer data for additional info
      const selectedCustomerData = customers.find(c => (c._id || c.id) === selectedCustomer);

      if (!selectedCustomerData) {
        throw new Error('Selected customer not found');
      }

      // Prepare order items with product and attribute details
      const orderItems = productRows.map((row) => {
        const product = products.find(p => (p._id || p.id) === row.productId);
        const attribute = product?.attributes?.find(attr => attr._id === row.attributeId);

        if (!product || !attribute) {
          throw new Error(`Product or attribute not found for row`);
        }

        return {
          productId: row.productId,
          productName: getProductDisplayName(product),
          attributeId: row.attributeId,
          attributeName: attribute.name,
          quantity: row.quantity,
          price: attribute.price,
          discountedPrice: attribute.discountedPrice,
          subtotal: getRowSubtotal(row),
          image: product.images && product.images.length > 0 ? product.images[0] : ''
        };
      });

      // Prepare the payload matching your Order schema
      const payload = {
        customerId: selectedCustomer,
        customerName: getCustomerDisplayName(selectedCustomerData),
        salesAgentName: selectedCustomerData.salesAgentName || selectedCustomerData.name,
        villageName: selectedCustomerData.villageName,
        mobileNumber: selectedCustomerData.mobileNumber,
        villageCode: selectedCustomerData.villageCode,
        fulfillmentType: fulfillment,
        items: orderItems,
        totalItems,
        totalAmount: orderTotal
      };

      console.log('Placing order with payload:', payload);

      // Make API call to place order
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/fromAdmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Order placed successfully:', result);

        toast({
          title: "Order placed successfully",
          description: `Order #${result.data.orderId.slice(-8)} with ₹${orderTotal} total placed for ${getCustomerDisplayName(selectedCustomerData)}.`,
        });

        setOpen(false);
        resetForm();
        // Refresh dashboard data to show new order
        fetchDashboardData();
      } else {
        throw new Error(result.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${formattedDate}, ${formattedTime}`;
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your inventory management system</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          aria-label="Place new order"
          title="Place new order"
          disabled={loadingOrderData}
        >
          <Plus className="h-4 w-4" />
          {loadingOrderData ? 'Loading...' : 'Place Order'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalCategories}
            </div>
            <p className="text-xs text-muted-foreground">Categories in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <Link
                href="/dashboard/orders/pending"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                View All Orders
              </Link>
            </div>
            <CardDescription>Recent pending orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order: any, index) => (
                  <div key={order._id || order.id || index} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Order #{order._id?.slice(-8) || order.id?.slice(-8) || `${index + 1}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.itemCount || 0} items • {formatDate(order.orderDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.salesAgentName} • {order.villageName} • {order.mobileNumber}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Cancelled Orders</CardTitle>
              <Link
                href="/dashboard/orders/cancel"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                View All Orders
              </Link>
            </div>
            <CardDescription>Recently cancelled orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : cancelledOrders.length > 0 ? (
                cancelledOrders.map((order: any, index) => (
                  <div key={order._id || order.id || index} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        Order #{order._id?.slice(-8) || order.id?.slice(-8) || `${index + 1}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cancelled • {formatDate(order.orderDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.salesAgentName} • {order.villageName} • {order.mobileNumber}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">
                        {order.itemCount || 0} Items
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No cancelled orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Place Order Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[800px] overflow-x-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>
              Select a customer, choose fulfillment, then add one or more products with attributes and quantities.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <SearchableSelect
                options={customerOptions}
                value={selectedCustomer ?? ""}
                onChange={(v) => setSelectedCustomer(v)}
                placeholder="Search or select customer"
                disabled={loadingOrderData || placingOrder}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label>Products</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductRow}
                  disabled={!selectedCustomer || loadingOrderData || placingOrder}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add product
                </Button>
              </div>

              {productRows.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add one or more products after selecting a customer. Each product requires an attribute and quantity.
                </p>
              )}

              <div className="grid gap-3">
                {productRows.map((row, index) => {
                  const attrOptions = attributeOptionsForProduct(row.productId);
                  const subtotal = getRowSubtotal(row);
                  
                  return (
                    <div
                      key={`prod-row-${index}`}
                      className="rounded-md border p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <Label className="text-sm font-medium mb-1 block">Product</Label>
                          <SearchableSelect
                            options={productOptions}
                            value={row.productId}
                            onChange={(v) => updateRowProduct(index, v)}
                            placeholder="Search or select product"
                            disabled={loadingOrderData || placingOrder}
                          />
                        </div>
                        <div className="min-w-0">
                          <Label className="text-sm font-medium mb-1 block">Attribute</Label>
                          <SearchableSelect
                            options={attrOptions}
                            value={row.attributeId}
                            onChange={(v) => updateRowAttribute(index, v)}
                            placeholder="Search or select attribute"
                            disabled={!row.productId || loadingOrderData || placingOrder}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Quantity:</Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => decRowQty(index)}
                            disabled={placingOrder}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => setRowQuantity(index, Number(e.target.value))}
                            className="w-16 text-center h-8"
                            disabled={placingOrder}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => incRowQty(index)}
                            disabled={placingOrder}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {subtotal > 0 && (
                            <div className="text-sm font-semibold text-green-600">
                              Subtotal: ₹{subtotal}
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => removeProductRow(index)}
                            aria-label="Remove product"
                            disabled={placingOrder}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {productRows.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {productRows.length} product{productRows.length === 1 ? "" : "s"} • {totalItems} total item{totalItems === 1 ? "" : "s"}
                    </span>
                  </div>
                  {orderTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Order Total:</span>
                      <span className="text-xl font-bold text-green-600">₹{orderTotal}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Fulfillment</Label>
              <RadioGroup
                value={fulfillment ?? ""}
                onValueChange={(v) => setFulfillment(v as "takeaway" | "delivery")}
                className="flex flex-wrap items-center gap-4"
                disabled={placingOrder}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="fulfillment-takeaway" value="takeaway" disabled={placingOrder} />
                  <Label htmlFor="fulfillment-takeaway">Takeaway</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="fulfillment-delivery" value="delivery" disabled={placingOrder} />
                  <Label htmlFor="fulfillment-delivery">Delivery</Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={placingOrder}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || placingOrder}>
                {placingOrder ? 'Placing Order...' : `Place Order${orderTotal > 0 ? ` - ₹${orderTotal}` : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
