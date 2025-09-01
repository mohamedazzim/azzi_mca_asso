"use client"

import type React from "react"
import { useState, useEffect, memo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
  uploadingPhoto: boolean;
  fileInputRef: HTMLInputElement | null;
  setFileInputRef: (element: HTMLInputElement | null) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: () => void;
}>(({ previewUrl, selectedFile, formData, loading, uploadingPhoto, fileInputRef, setFileInputRef, handleFileSelect, removePhoto }) => (
  <div className="flex items-center space-x-6">
    <Avatar className="h-24 w-24">
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
          disabled={loading || uploadingPhoto}
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
            disabled={loading || uploadingPhoto}
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
      <CardDescription>Update the student information below</CardDescription>
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

function EditStudentPageContent() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
  const [photoVersion, setPhotoVersion] = useState(Date.now())
  const [role, setRole] = useState<string>("")

  // Fetch student data on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = JSON.parse(localStorage.getItem("user") || "{}")
      let userRole = ""
      if (storedData.role) {
        userRole = storedData.role
      } else if (storedData.user && storedData.user.role) {
        userRole = storedData.user.role
      }
      setRole(userRole)
    }
  }, [])

  useEffect(() => {
    if (role === "staff") {
      router.replace(`/admin/students/${studentId}`)
    }
  }, [role, router, studentId])

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setFetching(true)
        const response = await fetch(`/api/students/${studentId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch student data')
        }
        const student = await response.json()
        
        // Pre-populate form with existing data
        setFormData({
          name: student.name || "",
          rollNumber: student.rollNumber || "",
          email: student.email || "",
          phone: student.phone || "",
          batch: student.batch || "",
          section: student.section || "",
          gender: student.gender || "",
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
          bloodGroup: student.bloodGroup || "",
          guardianName: student.guardianName || "",
          guardianPhone: student.guardianPhone || "",
          address: student.address || "",
          photoUrl: student.photoUrl || "",
          hostellerStatus: student.hostellerStatus || "",
        })
      } catch (error) {
        console.error('Error fetching student:', error)
        toast({
          title: "Error",
          description: "Failed to fetch student data",
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }

    if (studentId) {
      fetchStudent()
    }
  }, [studentId, toast])

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

  const handlePhotoUpload = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    setUploadingPhoto(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('studentId', studentId)

      const response = await fetch('/api/students/upload-photo', {
        method: 'POST',
        headers: {
          'x-user-role': role,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Upload error:", errorData)
        throw new Error(errorData.error || 'Failed to upload photo')
      }

      const result = await response.json()

      // Always set photoUrl to the API route after upload
      setFormData((prev) => ({
        ...prev,
        photoUrl: `/api/students/${studentId}/photo`
      }))

      // Clear selected file and preview
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl("")
      // Force avatar to reload by updating version
      setPhotoVersion(Date.now())
      toast({
        title: "Success",
        description: "Photo uploaded and stored in database successfully",
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }, [selectedFile, studentId, role, previewUrl, toast])

  const removePhoto = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl("")
  }, [previewUrl])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // If a photo is selected, upload it first
      if (selectedFile) {
        setUploadingPhoto(true)
        const photoFormData = new FormData()
        photoFormData.append('photo', selectedFile)
        photoFormData.append('studentId', studentId)
        const photoResponse = await fetch('/api/students/upload-photo', {
          method: 'POST',
          headers: {
            'x-user-role': role,
          },
          body: photoFormData,
        })
        if (!photoResponse.ok) {
          const errorData = await photoResponse.json()
          throw new Error(errorData.error || 'Failed to upload photo')
        }
        // Always set photoUrl to the API route after upload
        setFormData((prev) => ({
          ...prev,
          photoUrl: `/api/students/${studentId}/photo`
        }))
        setSelectedFile(null)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl("")
        setPhotoVersion(Date.now())
        setUploadingPhoto(false)
      }

      // Now submit the rest of the form
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update student')
      }

      toast({
        title: "Success",
        description: "Student updated successfully",
      })
      router.push("/admin/students")
    } catch (error) {
      console.error('Error updating student:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, selectedFile, studentId, role, router, toast, previewUrl])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

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
    { value: "O-", label: "O-" }
  ]

  const hostellerOptions = [
    { value: "Hosteller", label: "Hosteller" },
    { value: "Dayscholar", label: "Dayscholar" }
  ];

  if (fetching) {
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
                <p className="text-gray-600">Update student information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Update the student information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <PhotoUpload
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                formData={formData}
                loading={loading}
                uploadingPhoto={uploadingPhoto}
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
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Guardian Name"
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(value) => handleInputChange("guardianName", value)}
                  icon={<User className="h-4 w-4" />}
                />
                
                <FormField
                  label="Guardian Phone"
                  id="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(value) => handleInputChange("guardianPhone", value)}
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
                icon={<MapPin className="h-4 w-4" />}
              />

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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Student
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

export default function EditStudentPage() {
  return (
    <AuthGuard>
      <EditStudentPageContent />
    </AuthGuard>
  )
} 