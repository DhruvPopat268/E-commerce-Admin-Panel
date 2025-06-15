"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    mobileNumber: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  
  console.log('=== FRONTEND LOGIN ATTEMPT ===')
  console.log('Current cookies before login:', document.cookie)
  
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/admin/login`, 
      formData, 
      {
        withCredentials: true,
      }
    )
    
    console.log('Login response:', response.data)
    console.log('Response headers:', response.headers)
    
    if (response.status === 200) {
      console.log('Login successful')
      
      // Wait a moment then check cookies
      setTimeout(() => {
        console.log('Cookies after login:', document.cookie)
        
        // Manual cookie check
        const allCookies = document.cookie.split(';').map(c => c.trim())
        console.log('All cookies array:', allCookies)
        
        const tokenCookie = allCookies.find(c => c.startsWith('token='))
        const adminTokenCookie = allCookies.find(c => c.startsWith('adminToken='))
        
        console.log('Token cookie found:', tokenCookie)
        console.log('AdminToken cookie found:', adminTokenCookie)
      }, 1000)
      
      // Also store in localStorage as backup
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        console.log('Token stored in localStorage:', response.data.token)
      }
      
      // Check redirect
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect') || '/dashboard';
      
      console.log('Redirecting to:', redirectPath)
      router.push(redirectPath);
    }
  } catch (error) {
    console.error('Login failed:', error);
    console.error('Error response:', error.response?.data);
  }
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login to your account</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                type="mobileNumber"
                placeholder="enter your mobile number"
                required
                value={formData.mobileNumber}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Login
            </Button>
            
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
