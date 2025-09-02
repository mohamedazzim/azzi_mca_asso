"use client"

import { useEffect, useState, memo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Shield, User, Lock } from "lucide-react"
import Image from "next/image"

// Memoized components for better performance
const LoginForm = memo<{
  credentials: { username: string; password: string };
  setCredentials: (creds: { username: string; password: string }) => void;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;
  error: string;
}>(({ credentials, setCredentials, loading, showPassword, setShowPassword, handleLogin, error }) => (
  <form onSubmit={handleLogin} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
        Username
      </Label>
      <Input
        id="username"
        value={credentials.username}
        onChange={e => setCredentials({ ...credentials, username: e.target.value })}
        placeholder="Enter your username"
        className="h-12 px-4 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all duration-200 bg-white"
        autoFocus
        disabled={loading}
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={credentials.password}
          onChange={e => setCredentials({ ...credentials, password: e.target.value })}
          placeholder="Enter your password"
          className="h-12 px-4 pr-12 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all duration-200 bg-white"
          disabled={loading}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
    
    {error && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )}
    
    <Button
      type="submit"
      className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing In...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  </form>
))

const DemoCredentials = memo(() => (
  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        Login Credentials
      </CardTitle>
      <CardDescription>Use these credentials to access the system</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex items-center justify-between p-2 bg-white rounded border">
        <span className="font-medium text-blue-600">Admin:</span>
        <span className="font-mono text-xs">thams.ca@bhc.edu.in / Azzi@2026</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-white rounded border">
        <span className="font-medium text-green-600">Staff:</span>
        <span className="font-mono text-xs">staff@bhc.edu.in / Staff@MCA</span>
      </div>
    </CardContent>
  </Card>
))

// Skeleton loader
const LoginSkeleton = () => (
  <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
    <div className="flex flex-col items-center mb-10">
      <div className="w-24 h-24 bg-gray-200 mb-6 animate-pulse"></div>
      <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
    </div>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
  </div>
)

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Check if user is already logged in
    const user = localStorage.getItem("user")
    if (user) {
      try {
        const userObj = JSON.parse(user)
        if (userObj && userObj.username) {
          router.replace("/admin/dashboard")
          return
        }
      } catch (error) {
        // Invalid user data, clear it
        localStorage.removeItem("user")
      }
    }
    
    // Add a migration step to ensure role is present in localStorage user
    const userStr = localStorage.getItem("user")
    if (userStr) {
      let userObj
      try { 
        userObj = JSON.parse(userStr) 
      } catch { 
        userObj = null 
      }
      if (userObj && !userObj.role && userObj.username) {
        // Try to infer admin if username is admin
        userObj.role = userObj.username === "admin" ? "admin" : "staff"
        localStorage.setItem("user", JSON.stringify(userObj))
      }
    }
    
    setInitializing(false)
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store user data in localStorage for frontend access (with role)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.replace("/admin/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(`Network error: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400">
        <LoginSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">
            <Image 
              src="/department-logo.png" 
              alt="MCA Department Logo" 
              width={100} 
              height={100}
              className="w-24 h-24 object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to MCA Department Portal</p>
          </div>
        </div>
        
        <LoginForm
          credentials={credentials}
          setCredentials={setCredentials}
          loading={loading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleLogin={handleLogin}
          error={error}
        />
        
        <div className="mt-6">
          <DemoCredentials />
        </div>
      </div>
    </div>
  )
}
