"use client"

import { useEffect, useState, memo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Shield, User, Lock } from "lucide-react"

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
      <Label htmlFor="username" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Username
      </Label>
      <Input
        id="username"
        value={credentials.username}
        onChange={e => setCredentials({ ...credentials, username: e.target.value })}
        placeholder="Enter your username"
        className="h-12 text-lg"
        autoFocus
        disabled={loading}
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="password" className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={credentials.password}
          onChange={e => setCredentials({ ...credentials, password: e.target.value })}
          placeholder="Enter your password"
          className="h-12 text-lg pr-12"
          disabled={loading}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
    
    {error && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">{error}</p>
      </div>
    )}
    
    <Button
      type="submit"
      className="w-full h-12 text-lg font-semibold"
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Signing In...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-5 w-5" />
          Sign In
        </>
      )}
    </Button>
  </form>
))

const DemoCredentials = memo(() => (
  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        Demo Credentials
      </CardTitle>
      <CardDescription>Use these credentials to test the system</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div className="flex items-center justify-between p-2 bg-white rounded border">
        <span className="font-medium text-blue-600">Admin:</span>
        <span className="font-mono">admin / admin123</span>
      </div>
      <div className="flex items-center justify-between p-2 bg-white rounded border">
        <span className="font-medium text-green-600">Staff:</span>
        <span className="font-mono">staff / staff123</span>
      </div>
    </CardContent>
  </Card>
))

// Skeleton loader
const LoginSkeleton = () => (
  <div className="w-full max-w-md p-8 bg-white/90 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-lg">
    <div className="flex flex-col items-center mb-6">
      <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
      <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
    </div>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
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
      setError("Network error. Please try again.")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400 animate-gradient-x overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 w-[600px] h-[600px] bg-indigo-400 opacity-30 rounded-full blur-3xl animate-blob1" />
        <div className="absolute right-1/4 top-1/4 w-[400px] h-[400px] bg-sky-300 opacity-30 rounded-full blur-2xl animate-blob2" />
        <div className="absolute left-1/4 bottom-0 w-[500px] h-[500px] bg-emerald-300 opacity-30 rounded-full blur-2xl animate-blob3" />
      </div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-white/90 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-lg animate-fadein">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 p-3 rounded-full mb-4 animate-pop">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">MCA Department</h1>
          <p className="text-gray-500 text-sm font-medium">Association Activity Management System</p>
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
        
        
      </div>
      
      {/* Animations */}
      <style>{`
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fadein {
          animation: fadein 0.8s cubic-bezier(.4,2,.6,1) both;
        }
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          100% { opacity: 1; transform: none; }
        }
        .animate-pop {
          animation: pop 0.7s cubic-bezier(.4,2,.6,1) both;
        }
        @keyframes pop {
          0% { opacity: 0; transform: scale(0.7); }
          80% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-blob1 {
          animation: blob1 12s ease-in-out infinite alternate;
        }
        .animate-blob2 {
          animation: blob2 14s ease-in-out infinite alternate;
        }
        .animate-blob3 {
          animation: blob3 16s ease-in-out infinite alternate;
        }
        @keyframes blob1 {
          0% { transform: translate(-50%, 0) scale(1); }
          100% { transform: translate(-60%, -10%) scale(1.1); }
        }
        @keyframes blob2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(10%, 10%) scale(1.15); }
        }
        @keyframes blob3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-10%, 10%) scale(1.08); }
        }
      `}</style>
    </div>
  )
}
