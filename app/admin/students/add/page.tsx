"use client"

import type React from "react"
import { useEffect, useState, memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Upload, Save, Loader2, X, User, Phone, Mail, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"


// Memoized components for better performance
const PhotoUpload = memo<{
  previewUrl: string;
  selectedFile: File | null;
  formData: any;
  loading: boolean;
  fileInputRef: HTMLInputElement | null;
  setFileInputRef: (element: HTMLInputElement | null) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: () => void;
}>(({ previewUrl, selectedFile, formData, loading, fileInputRef, setFileInputRef, handleFileSelect, removePhoto }) => (
  <div className="flex items-center space-x-6">
    <Avatar className="h-32 w-24">
      <AvatarImage 
        src={previewUrl || formData.photoUrl || undefined} 
      />
      <AvatarFallback className="text-lg">
        {formData.name
          ? formData.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
          : "ST"}
      </AvatarFallback>
    </Avatar>
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={(element) => setFileInputRef(element)}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          className="cursor-pointer"
          onClick={() => fileInputRef?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Select Photo
        </Button>
        {selectedFile && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={removePhoto}
            disabled={loading}
            className="cursor-pointer"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
      <p className="text-sm text-gray-600">JPG, PNG, WebP up to 2MB</p>
      {selectedFile && (
        <p className="text-sm text-blue-600">Selected: {selectedFile.name}</p>
      )}
    </div>
  </div>
))

const FormField = memo<{
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
}>(({ label, id, type = "text", value, onChange, placeholder, required = false, options, icon }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2">
      {icon}
      {label} {required && "*"}
    </Label>
    {options ? (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    )}
  </div>
))

// Skeleton loader
const FormSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle>Student Information</CardTitle>
      <CardDescription>Fill in all the required details for the new student</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Photo skeleton */}
        <div className="flex items-center space-x-6">
          <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Form fields skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Submit button skeleton */}
        <div className="flex justify-end space-x-4">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

function AddStudentPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    email: "",
    phone: "",
    batch: "",
    section: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    photoUrl: "",
    hostellerStatus: "",
  })
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
  const [role, setRole] = useState<string>("")
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      setRole(user.role || "")
    }
  }, [])
  
  useEffect(() => {
    if (role === "staff") {
      router.replace("/admin/students")
    }
  }, [role, router])

  const requiredFields = [
    { key: 'name', label: 'Name' },
    { key: 'rollNumber', label: 'Roll number' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'batch', label: 'Batch' },
    { key: 'section', label: 'Section' },
    { key: 'gender', label: 'Gender' },
    { key: 'dateOfBirth', label: 'Date of birth' },
    { key: 'bloodGroup', label: 'Blood group' },
    { key: 'guardianName', label: 'Guardian / Parent Name' },
    { key: 'guardianPhone', label: 'Guardian / Parent Phone' },
    { key: 'address', label: 'Address' },
    { key: 'hostellerStatus', label: 'Hosteller / Dayscholar' },
  ];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("");
    // Client-side validation
    for (const field of requiredFields) {
      if (!(formData as Record<string, string>)[field.key]) {
        setErrorMsg(`${field.label} is required`);
        return;
      }
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg("Email format is invalid");
      return;
    }
    // Phone format validation (basic: digits, optional +, 10-15 chars)
    const phoneRegex = /^[+]?\d{10,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setErrorMsg("Phone number format is invalid");
      return;
    }
    
    try {
      setLoading(true)
      
      // Extract user role from localStorage (support all formats)
      const storedData = JSON.parse(localStorage.getItem("user") || "{}")
      let userRole = ""
      if (storedData.role) {
        userRole = storedData.role
      } else if (storedData.user && storedData.user.role) {
        userRole = storedData.user.role
      }
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrorMsg(errorData.error || 'Failed to create student');
        throw new Error(errorData.error || 'Failed to create student')
      }

      const result = await response.json()
      const studentId = result.id
      
      // If there's a selected photo, upload it
      if (selectedFile && studentId) {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}")
          const photoFormData = new FormData()
          photoFormData.append('photo', selectedFile)
          photoFormData.append('studentId', studentId)
          const photoResponse = await fetch('/api/students/upload-photo', {
            method: 'POST',
            headers: {
              'x-user-role': user.role || '',
            },
            body: photoFormData,
          })
          if (!photoResponse.ok) {
            const photoErrorData = await photoResponse.json()
            // Don't throw error here, just log it as the student was created successfully
          }
        } catch (photoError) {
          // Don't throw error here, just log it as the student was created successfully
        }
      }
      
      toast({
        title: "Success",
        description: "Student created successfully",
      })
      
      router.push("/admin/students")
    } catch (error) {
      console.error('Error creating student:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create student",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, selectedFile, router, toast])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrorMsg("");
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a valid image file (JPG, PNG, WebP)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 2MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }, [toast])

  const removePhoto = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl("")
  }, [previewUrl])

  // Form field configurations
  const batchOptions = [
    { value: "2023-2025", label: "2023-2025" },
    { value: "2024-2026", label: "2024-2026" },
    { value: "2025-2027", label: "2025-2027" }
  ]

  const sectionOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" }
  ]

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" }
  ]

  const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
    { value: "A1+ve", label: "A1+ve" },
    { value: "A1-ve", label: "A1-ve" },
    { value: "A2+ve", label: "A2+ve" },
    { value: "A2-ve", label: "A2-ve" },
    { value: "B+ve", label: "B+ve" },
    { value: "B-ve", label: "B-ve" },
    { value: "AB+ve", label: "AB+ve" },
  ]

  const hostellerOptions = [
    { value: "Hosteller", label: "Hosteller" },
    { value: "Dayscholar", label: "Dayscholar" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FormSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
                <p className="text-gray-600">Register a new student in the system</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Fill in all the required details for the new student</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <PhotoUpload
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                formData={formData}
                loading={loading}
                fileInputRef={fileInputRef}
                setFileInputRef={setFileInputRef}
                handleFileSelect={handleFileSelect}
                removePhoto={removePhoto}
              />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  id="name"
                  value={formData.name}
                  onChange={(value) => handleInputChange("name", value)}
                  required
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Roll Number"
                  id="rollNumber"
                  value={formData.rollNumber}
                  onChange={(value) => handleInputChange("rollNumber", value)}
                  placeholder="e.g., MCA24A001"
                  required
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Email Address"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange("email", value)}
                  required
                  icon={<Mail className="h-4 w-4" />}
                />
                
                <FormField
                  label="Phone Number"
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  placeholder="+91 9876543210"
                  required
                  icon={<Phone className="h-4 w-4" />}
                />
                
                <FormField
                  label="Batch"
                  id="batch"
                  value={formData.batch}
                  onChange={(value) => handleInputChange("batch", value)}
                  options={batchOptions}
                  required
                  icon={<Calendar className="h-4 w-4" />}
                />
                
                <FormField
                  label="Section"
                  id="section"
                  value={formData.section}
                  onChange={(value) => handleInputChange("section", value)}
                  options={sectionOptions}
                  required
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Gender"
                  id="gender"
                  value={formData.gender}
                  onChange={(value) => handleInputChange("gender", value)}
                  options={genderOptions}
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Date of Birth"
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(value) => handleInputChange("dateOfBirth", value)}
                  required
                  icon={<Calendar className="h-4 w-4" />}
                />
                
                <FormField
                  label="Blood Group"
                  id="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={(value) => handleInputChange("bloodGroup", value)}
                  options={bloodGroupOptions}
                  required
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Guardian / Parent Name"
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(value) => handleInputChange("guardianName", value)}
                  required
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Guardian / Parent Phone"
                  id="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(value) => handleInputChange("guardianPhone", value)}
                  required
                  icon={<Phone className="h-4 w-4" />}
                />
                
                <FormField
                  label="Hosteller / Dayscholar"
                  id="hostellerStatus"
                  value={formData.hostellerStatus}
                  onChange={(value) => handleInputChange("hostellerStatus", value)}
                  options={hostellerOptions}
                  required
                  icon={<User className="h-4 w-4" />}
                />
              </div>

              {/* Address */}
              <FormField
                label="Address"
                id="address"
                value={formData.address}
                onChange={(value) => handleInputChange("address", value)}
                placeholder="Enter complete address"
                required
                icon={<MapPin className="h-4 w-4" />}
              />

              {errorMsg && (
                <div className="text-red-600 text-sm mb-2 text-center font-semibold">
                  {errorMsg.charAt(0).toUpperCase() + errorMsg.slice(1)}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/admin/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Student
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AddStudentPage() {
  return (
    <AuthGuard>
      <AddStudentPageContent />
    </AuthGuard>
  )
}
