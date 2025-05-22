"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Package, LayoutDashboard, LogOut, Menu, ShoppingBag, Users, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Categories",
      icon: Package,
      href: "/dashboard/categories",
      active: pathname === "/dashboard/categories",
    },
    {
      label: "Items",
      icon: ShoppingBag,
      href: "/dashboard/items",
      active: pathname === "/dashboard/items",
    },
    {
      label: "Item Attributes",
      icon: Settings,
      href: "/dashboard/attributes",
      active: pathname === "/dashboard/attributes",
    },
    {
      label: "User Logs",
      icon: Users,
      href: "/dashboard/user-logs",
      active: pathname === "/dashboard/user-logs",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      active: pathname === "/dashboard/analytics",
    },
  ]

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center justify-center px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Package className="h-8 w-8 text-white" />
              <span className="font-bold text-2xl text-white">Admin</span>
            </Link>
          </div>
          <div className="flex-1 flex flex-col px-6 py-4 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all
                  ${route.active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}
                `}
              >
                <route.icon className={`h-5 w-5 ${route.active ? "text-white" : "text-gray-400"}`} />
                {route.label}
              </Link>
            ))}
          </div>
          <div className="p-6">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full justify-start text-white bg-gray-800 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="md:pl-72">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 md:px-8">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <div className="flex flex-col h-full bg-gray-900">
                <div className="h-20 flex items-center px-6 justify-between">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Package className="h-8 w-8 text-white" />
                    <span className="font-bold text-2xl text-white">Admin</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                    <X className="h-6 w-6 text-white" />
                  </Button>
                </div>
                <div className="flex-1 flex flex-col px-6 py-4 space-y-1">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all
                        ${route.active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}
                      `}
                    >
                      <route.icon className={`h-5 w-5 ${route.active ? "text-white" : "text-gray-400"}`} />
                      {route.label}
                    </Link>
                  ))}
                </div>
                <div className="p-6">
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-white bg-gray-800 hover:bg-gray-700 hover:text-white"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-x-4">
              <div className="hidden md:flex md:items-center md:gap-4">
                <div className="text-sm font-medium">Admin User</div>
              </div>
            </div>
          </div>
        </div>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
