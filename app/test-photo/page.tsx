"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TestPhotoPage() {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [testStudentId, setTestStudentId] = useState("686eb864bff1118f7400ac24")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('studentId', testStudentId)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch('/api/students/upload-photo', {
        method: 'POST',
        headers: {
          'x-user-role': user.role || '',
        },
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }
      const result = await response.json()
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl("")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Photo Upload Test</CardTitle>
            <CardDescription>Test the photo upload functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Test Student ID:</label>
              <input
                type="text"
                value={testStudentId}
                onChange={(e) => setTestStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a valid student ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Photo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Selected File:</h3>
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                
                {previewUrl && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Preview:</h4>
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={previewUrl} />
                      <AvatarFallback>Preview</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
              
              {selectedFile && (
                <Button 
                  onClick={clearSelection}
                  variant="outline"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="mt-8">
              <h2 className="font-semibold mb-4">Test Photo Display:</h2>
              <div className="flex items-center space-x-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={`/api/students/${testStudentId}/photo`}
                    alt="Test photo"
                  />
                  <AvatarFallback>No Photo</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Photo URL:</strong> /api/students/{testStudentId}/photo
                  </p>
                  <p className="text-sm text-gray-600">
                    This should display the uploaded photo or a placeholder if no photo exists.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold mb-2">Testing Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Enter a valid student ID (or use the default one)</li>
                <li>Select an image file (JPG, PNG, WebP, max 2MB)</li>
                <li>Click "Upload Photo" to test the upload</li>
                <li>Check if the photo displays correctly below</li>
                <li>Try refreshing the page to test persistence</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-semibold mb-2">Button Test:</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Click the buttons below to test if they respond to clicks:
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => alert('Select Photo button works!')}
                    variant="outline"
                    size="sm"
                  >
                    Test Select Photo
                  </Button>
                  <Button 
                    onClick={() => alert('Upload button works!')}
                    variant="outline"
                    size="sm"
                  >
                    Test Upload
                  </Button>
                  <Button 
                    onClick={() => alert('Remove button works!')}
                    variant="outline"
                    size="sm"
                  >
                    Test Remove
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 