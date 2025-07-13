"use client"

import type React from "react"
import { useState, useEffect, memo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Plus, Loader2, FileText, Image, Users } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { StudentSelectionModal } from "@/components/student-selection-modal"

// Define Student type for this file
interface Student {
  id: string;
  name: string;
  rollNumber: string;
  batch: string;
  section: string;
  photo: string;
}

interface Winner {
  studentId: string;
  award: string;
}

interface FileUploadSectionProps {
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFiles: File | File[] | null;
  icon: React.ElementType;
  multiple?: boolean;
}

// Memoized components for better performance
const WinnerCard = memo<{
  winner: Winner;
  index: number;
  availableStudents: Student[];
  updateWinner: (index: number, field: string, value: string | number) => void;
  removeWinner: (index: number) => void;
  usedAwards: string[];
  usedStudentIds: string[];
}>(({ winner, index, availableStudents, updateWinner, removeWinner, usedAwards, usedStudentIds }) => {
  // Only allow awards not already used, or the current one
  const awardOptions = ["Winner", "Runner"].filter(option => !usedAwards.includes(option) || winner.award === option);
  // Only allow students not already selected, or the current one
  const studentOptions = availableStudents.filter(student => !usedStudentIds.includes(student.id) || winner.studentId === student.id);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
    <div className="space-y-2">
      <Label>Student</Label>
      <select
        value={winner.studentId}
        onChange={(e) => updateWinner(index, "studentId", e.target.value)}
        className="w-full p-2 border rounded-md"
      >
        <option value="">Select Student</option>
          {studentOptions.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name} ({student.rollNumber})
          </option>
        ))}
      </select>
    </div>
    <div className="space-y-2">
      <Label>Award Title</Label>
        <select
        value={winner.award}
          onChange={e => updateWinner(index, "award", e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select Award</option>
          {awardOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
    </div>
    <div className="flex items-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => removeWinner(index)}
        className="text-red-600 hover:text-red-700"
      >
        Remove
      </Button>
    </div>
  </div>
  );
});
WinnerCard.displayName = "WinnerCard";

const FileUploadSection = memo<FileUploadSectionProps>(({ label, accept, onChange, selectedFiles, icon: Icon, multiple }) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {label}
    </Label>
    <Input type="file" accept={accept} onChange={onChange} multiple={multiple} />
    {selectedFiles && (
      <div className="text-sm text-blue-600">
        {Array.isArray(selectedFiles) ? (
          <ul className="list-disc ml-4">
            {selectedFiles.map((file, idx) => <li key={idx}>{file.name}</li>)}
          </ul>
        ) : (
          <p>Selected: {selectedFiles.name}</p>
        )}
      </div>
    )}
  </div>
))
FileUploadSection.displayName = "FileUploadSection"

// Skeleton loaders
const FormSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Event Information</CardTitle>
        <CardDescription>Basic details about the event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Event Documentation</CardTitle>
        <CardDescription>Upload event report, attendance sheet, and geotagged photos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
)
FormSkeleton.displayName = "FormSkeleton"

function AddEventPageContent() {
  const router = useRouter()
  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    location: string;
    chiefGuest: string;
    fundSpent: string;
    description: string;
    attendanceSheet: null;
    photos: File[];
    selectedStudents: string[];
  }>({
    title: "",
    date: "",
    location: "",
    chiefGuest: "",
    fundSpent: "",
    description: "",
    attendanceSheet: null,
    photos: [],
    selectedStudents: [],
  })
  const [isCompetition, setIsCompetition] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([])
  const [role, setRole] = useState<string>("")
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [attendanceFiles, setAttendanceFiles] = useState<File[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [participantStudents, setParticipantStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      setRole(user.role || "")
    }
  }, [])
  
  useEffect(() => {
    if (role === "staff") {
      router.replace("/admin/events")
    }
  }, [role, router])

  const validateFile = (file: File, type: 'report' | 'attendance' | 'photo'): string | null => {
    if (!file) return null
    if (type === 'report') {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/heic'
      ]
      if (!allowed.includes(file.type)) return 'Invalid report file type.'
      if (file.size > 5 * 1024 * 1024) return 'Report file too large (max 5MB).'
    }
    if (type === 'attendance') {
      const allowed = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/heic'
      ]
      if (!allowed.includes(file.type)) return 'Invalid attendance file type.'
      if (file.size > 5 * 1024 * 1024) return 'Attendance file too large (max 5MB).'
    }
    if (type === 'photo') {
      const allowed = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/heic', 'application/pdf'
      ]
      if (!allowed.includes(file.type)) return 'Invalid photo file type.'
      if (file.size > 5 * 1024 * 1024) return 'Photo file too large (max 5MB).'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Validate files again before submit
    if (reportFile) {
      const err = validateFile(reportFile, 'report')
      if (err) {
        toast({ title: 'Error', description: err, variant: 'destructive' })
        setLoading(false)
        return
      }
    }
    for (const file of attendanceFiles) {
      const err = validateFile(file, 'attendance')
      if (err) {
        toast({ title: 'Error', description: err, variant: 'destructive' })
        setLoading(false)
        return
      }
    }
    for (const file of photoFiles) {
      const err = validateFile(file, 'photo')
      if (err) {
        toast({ title: 'Error', description: err, variant: 'destructive' })
        setLoading(false)
        return
      }
    }
    // If competition, require exactly 2 winners (Winner and Runner)
    if (isCompetition) {
      if (winners.length !== 2 || !winners.some(w => w.award === 'Winner') || !winners.some(w => w.award === 'Runner')) {
        toast({ title: 'Error', description: 'Please select exactly 2 winners: one Winner and one Runner.', variant: 'destructive' })
        setLoading(false)
        return
      }
      // Also ensure both have studentId selected
      if (winners.some(w => !w.studentId)) {
        toast({ title: 'Error', description: 'Please select a student for both Winner and Runner.', variant: 'destructive' })
        setLoading(false)
        return
      }
    }

    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const form = new FormData()
      form.append('title', formData.title)
      form.append('eventDate', formData.date)
      form.append('location', formData.location)
      form.append('chiefGuest', formData.chiefGuest)
      form.append('fundSpent', formData.fundSpent)
      form.append('description', formData.description)
      form.append('winners', JSON.stringify(winners))
      form.append('selectedStudents', JSON.stringify(formData.selectedStudents || []))
      form.append('isCompetition', isCompetition ? 'true' : 'false') // Send competition status
      if (reportFile) form.append('report', reportFile)
      if (attendanceFiles.length > 0) attendanceFiles.forEach(file => form.append('attendance', file))
      photoFiles.forEach((file) => form.append('photos', file))
      
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'x-user-role': user.role || '',
          },
          body: form,
        })
        if (response.ok) {
          toast({
            title: "Success",
            description: "Event created successfully.",
          })
          router.push("/admin/events")
        } else {
          const errorData = await response.json()
          toast({ title: 'Error', description: errorData.error || 'Failed to create event', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to create event', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addWinner = () => {
    setWinners((prev) => [...prev, { studentId: "", award: "" }]);
  }

  const updateWinner = (index: number, field: string, value: string | number) => {
    setWinners((prev) => prev.map((winner, i) => (i === index ? { ...winner, [field]: value } : winner)))
  }

  const removeWinner = (index: number) => {
    setWinners((prev) => prev.filter((_, i) => i !== index))
  }

  const availableStudents = participantStudents;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'report' | 'attendance' | 'photos') => {
    if (!e.target.files) return;
    if (type === 'report') {
      const file = e.target.files[0] || null
      const err = file ? validateFile(file, 'report') : null
      if (err) {
        toast({ title: 'Error', description: err, variant: 'destructive' })
        return
      }
      setReportFile(file)
    }
    if (type === 'attendance') {
      const files = Array.from(e.target.files)
      for (const file of files) {
        const err = validateFile(file, 'attendance')
        if (err) {
          toast({ title: 'Error', description: err, variant: 'destructive' })
          return
        }
      }
      setAttendanceFiles(files)
      setStudentModalOpen(true);
    }
    if (type === 'photos') {
      const files = Array.from(e.target.files)
      for (const file of files) {
        const err = validateFile(file, 'photo')
        if (err) {
          toast({ title: 'Error', description: err, variant: 'destructive' })
          return
        }
      }
      setPhotoFiles(files)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
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
                <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
                <p className="text-gray-600">Add a new event to the system</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>Basic details about the event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-2">
                <input
                  type="checkbox"
                  id="isCompetition"
                  checked={isCompetition}
                  onChange={e => setIsCompetition(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isCompetition">Is this a Competition?</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Hall/Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chiefGuest">{isCompetition ? "Judge Name" : "Chief Guest Name"}</Label>
                  <Input
                    id="chiefGuest"
                    value={formData.chiefGuest}
                    onChange={(e) => handleInputChange("chiefGuest", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundSpent">Fund Spent (₹)</Label>
                  <Input
                    id="fundSpent"
                    type="number"
                    value={formData.fundSpent}
                    onChange={(e) => handleInputChange("fundSpent", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Winners Section */}
          {isCompetition && (
            <Card>
              <CardHeader>
                <CardTitle>Competition Results</CardTitle>
                <CardDescription>Add winners and their achievements from verified attendees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="button" variant="outline" onClick={addWinner}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Winner
                </Button>

                {winners.map((winner, index) => (
                  <WinnerCard
                    key={index}
                    winner={winner}
                    index={index}
                    availableStudents={availableStudents}
                    updateWinner={updateWinner}
                    removeWinner={removeWinner}
                    usedAwards={winners.filter((w, i) => i !== index).map(w => w.award)}
                    usedStudentIds={winners.filter((w, i) => i !== index).map(w => w.studentId)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Event Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Event Documentation</CardTitle>
              <CardDescription>Upload event report, attendance sheet, and geotagged photos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadSection
                label="Event Report (PDF, DOC, DOCX, JPG, PNG, GIF, BMP, WEBP, HEIC)"
                accept=".pdf,.doc,.docx,image/jpeg,image/png,image/jpg,image/gif,image/bmp,image/webp,image/heic"
                onChange={e => handleFileChange(e, 'report')}
                selectedFiles={reportFile}
                icon={FileText}
              />
              <FileUploadSection
                label="Attendance Sheet (PDF, XLS, XLSX, JPG, PNG, GIF, BMP, WEBP, HEIC)"
                accept=".pdf,.xls,.xlsx,image/jpeg,image/png,image/jpg,image/gif,image/bmp,image/webp,image/heic"
                onChange={e => handleFileChange(e, 'attendance')}
                selectedFiles={attendanceFiles}
                icon={Users}
                multiple
              />
              <FileUploadSection
                label="Event Photos (Geotagged, JPG, PNG, GIF, BMP, WEBP, HEIC, PDF, multiple)"
                accept="image/jpeg,image/png,image/jpg,image/gif,image/bmp,image/webp,image/heic,application/pdf"
                onChange={e => handleFileChange(e, 'photos')}
                selectedFiles={photoFiles}
                icon={Image}
                multiple
              />
            </CardContent>
          </Card>

          {/* Summary */}
          {winners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {winners.length}
                    </p>
                    <p className="text-sm text-gray-600">Winners</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">₹{formData.fundSpent || 0}</p>
                    <p className="text-sm text-gray-600">Budget</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/events">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      <StudentSelectionModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onConfirm={(students) => {
          setParticipantStudents(students);
          setFormData((prev) => ({ ...prev, selectedStudents: students.map(s => s.id) }));
        }}
      />
    </div>
  )
}

export default function AddEventPage() {
  return (
    <AuthGuard>
      <AddEventPageContent />
    </AuthGuard>
  )
}
