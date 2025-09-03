"use client"

import { useState, useEffect, memo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, Upload, Trophy, FileText, Image as ImageIcon, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Memoized components for better performance
const WinnerRow = memo<{
  winner: any;
  index: number;
  students: any[];
  selectedAwards: string[];
  handleWinnerChange: (idx: number, field: string, value: string) => void;
  removeWinner: (idx: number) => void;
}>(({ winner, index, students, selectedAwards, handleWinnerChange, removeWinner }) => {
  const awardOptions = [
    !selectedAwards.includes('Winner') ? { value: 'Winner', label: 'Winner' } : undefined,
    !selectedAwards.includes('Runner') ? { value: 'Runner', label: 'Runner' } : undefined
  ].filter((opt): opt is { value: string; label: string } => opt !== undefined);

  return (
    <div className="flex flex-col md:flex-row gap-2 mb-2 items-center border-b pb-2">
      <Select value={winner.studentId} onValueChange={val => handleWinnerChange(index, 'studentId', val)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select Student" />
        </SelectTrigger>
        <SelectContent>
          {students.map(s => (
            <SelectItem key={s.id} value={s.id}>
              {s.name} ({s.rollNumber})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={winner.award} onValueChange={val => handleWinnerChange(index, 'award', val)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select Award" />
        </SelectTrigger>
        <SelectContent>
          {awardOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="destructive" size="sm" onClick={() => removeWinner(index)}>
        Remove
      </Button>
    </div>
  );
})

const FilePreview = memo<{ url: string; title: string; alt: string }>(({ url, title, alt }) => (
  <div>
    <div className="font-medium mb-1">{title}:</div>
    {url.match(/\.(jpg|jpeg|png|gif|bmp|webp|heic)$/i) ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Image 
          src={url} 
          alt={alt} 
          width={160}
          height={160}
          className="object-cover rounded shadow hover:scale-105 transition-transform" 
        />
      </a>
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
        View/Download {title}
      </a>
    )}
  </div>
))

// Skeleton loaders
const FormSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle>Event Details</CardTitle>
      <CardDescription>Update the event information below</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <div className="flex justify-end space-x-4">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const WinnersSkeleton = () => (
  <div className="mt-8">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-2 items-center border-b pb-2 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  </div>
)

const FilesSkeleton = () => (
  <div className="mt-8">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-40 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
)

function EditEventPageContent() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [role, setRole] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    eventDate: "",
    location: "",
    chiefGuest: "",
    fundSpent: "",
    description: "",
    eventType: "",
    status: "",
  })

  // Attendance OCR state
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResults, setOcrResults] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [manualRoll, setManualRoll] = useState("")
  const [manualName, setManualName] = useState("")

  // Winners/Runners state
  const [winners, setWinners] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reportUrl, setReportUrl] = useState<string>("");
  const [attendanceSheetUrl, setAttendanceSheetUrl] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setFetching(true)
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch event data')
        }
        const event = await response.json()
        
        setFormData({
          title: event.title || "",
          eventDate: event.date ? new Date(event.date).toISOString().split('T')[0] : "",
          location: event.location || "",
          chiefGuest: event.chiefGuest || "",
          fundSpent: event.fundSpent?.toString() || "",
          description: event.description || "",
          eventType: event.eventType || "",
          status: event.status || "",
        })
        setWinners(event.winners || []);
        setPhotos(event.photoUrls || []);
        setReportUrl(event.reportUrl || "");
        setAttendanceSheetUrl(event.attendanceSheetUrl || "");
      } catch (error) {
        // Event fetch error handled silently in production
        toast({
          title: "Error",
          description: "Failed to fetch event data",
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId, toast])

  useEffect(() => {
    // Fetch students for winner dropdown
    fetch('/api/students?pageSize=1000')
      .then(res => res.json())
      .then(data => setStudents(data.students || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role || '',
        },
        body: JSON.stringify({
          ...formData,
          fundSpent: parseFloat(formData.fundSpent) || 0,
          winners,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }

      toast({
        title: "Success",
        description: "Event updated successfully",
      })
      router.push("/admin/events")
    } catch (error) {
      // Event update error handled silently in production
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Attendance OCR handlers
  const handleAttendanceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && ((file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) || ((file.type === "image/jpeg" || file.type === "image/png") && file.size <= 5 * 1024 * 1024))) {
      setAttendanceFile(file)
    } else if (file) {
      toast({ title: "Error", description: "Please select a PDF or image (JPG, PNG) file up to 5MB.", variant: "destructive" })
    }
  }
  const runOcr = async () => {
    if (!attendanceFile) return
    setOcrLoading(true)
    setOcrResults([])
    setSelectedIds([])
    try {
      const form = new FormData()
      form.append(attendanceFile.type === "application/pdf" ? "pdf" : "image", attendanceFile)
      form.append("eventId", eventId)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const res = await fetch("/api/events/ocr-participants", {
        method: "POST",
        headers: { "x-user-role": user.role || "" },
        body: form,
      })
      if (!res.ok) throw new Error("OCR failed")
      const data = await res.json()
      setOcrResults(data.results)
      setSelectedIds(data.results.filter((r: any) => r.match?._id).map((r: any) => r.match._id))
      toast({ title: "OCR Complete", description: `Detected ${data.results.length} entries.` })
    } catch (err) {
      toast({ title: "Error", description: "Failed to process attendance sheet.", variant: "destructive" })
    } finally {
      setOcrLoading(false)
    }
  }
  const toggleSelect = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }
  const addManual = () => {
    if (!manualRoll && !manualName) return
    setOcrResults(results => [
      ...results,
      { roll: manualRoll, name: manualName, match: null, score: 0, raw: `${manualRoll} ${manualName}` }
    ])
    setManualRoll("")
    setManualName("")
  }
  const confirmAttendance = async () => {
    if (!selectedIds.length) {
      toast({ title: "Error", description: "No students selected.", variant: "destructive" })
      return
    }
    setOcrLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role || "" },
        body: JSON.stringify({ studentIds: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save attendance")
      toast({ title: "Attendance Saved", description: `Added: ${data.added}, Updated: ${data.updated}` })
      setOcrResults([])
      setSelectedIds([])
      setAttendanceFile(null)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save attendance", variant: "destructive" })
    } finally {
      setOcrLoading(false)
    }
  }

  const handleWinnerChange = (idx: number, field: string, value: string) => {
    setWinners(ws => ws.map((w, i) => i === idx ? { ...w, [field]: value } : w));
  };
  const addWinner = () => {
    setWinners(ws => [...ws, { studentId: '', award: '', position: '' }]);
  };
  const removeWinner = (idx: number) => {
    setWinners(ws => ws.filter((_, i) => i !== idx));
  };

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
          <WinnersSkeleton />
          <FilesSkeleton />
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
                <p className="text-gray-600">Update event information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Update the event information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange("eventDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter event location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chiefGuest">Chief Guest</Label>
                  <Input
                    id="chiefGuest"
                    value={formData.chiefGuest}
                    onChange={(e) => handleInputChange("chiefGuest", e.target.value)}
                    placeholder="Enter chief guest name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundSpent">Fund Spent (₹)</Label>
                  <Input
                    id="fundSpent"
                    type="number"
                    value={formData.fundSpent}
                    onChange={(e) => handleInputChange("fundSpent", e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical Workshop">Technical Workshop</SelectItem>
                      <SelectItem value="Cultural Event">Cultural Event</SelectItem>
                      <SelectItem value="Sports Competition">Sports Competition</SelectItem>
                      <SelectItem value="Academic Seminar">Academic Seminar</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter event description"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/admin/dashboard">
                  <Button variant="outline" type="button">
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
                      Update Event
                    </>
                  )}
                </Button>
              </div>
            </form>
            
            {/* Winners/Runners Section */}
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Winners & Runners
              </h3>
              {winners.length === 0 && <div className="text-gray-500 mb-2">No winners/runners added yet.</div>}
              {winners.map((winner, idx) => {
                const selectedAwards = winners.filter((_, i) => i !== idx).map(wi => wi.award);
                return (
                  <WinnerRow
                    key={idx}
                    winner={winner}
                    index={idx}
                    students={students}
                    selectedAwards={selectedAwards}
                    handleWinnerChange={handleWinnerChange}
                    removeWinner={removeWinner}
                  />
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addWinner}>
                <Trophy className="mr-2 h-4 w-4" />
                Add Winner/Runner
              </Button>
            </div>
            
            {/* File Previews Section */}
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Files
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {reportUrl && (
                  <FilePreview url={reportUrl} title="Report" alt="Report" />
                )}
                {attendanceSheetUrl && (
                  <FilePreview url={attendanceSheetUrl} title="Attendance Sheet" alt="Attendance Sheet" />
                )}
                {photos.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="font-medium mb-1 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Event Photos:
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {photos.map((url, idx) => (
                        url.match(/\.(jpg|jpeg|png|gif|bmp|webp|heic)$/i) ? (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                            <Image 
                              src={url} 
                              alt="Event Photo" 
                              width={160}
                              height={160}
                              className="object-cover rounded shadow hover:scale-105 transition-transform" 
                            />
                          </a>
                        ) : (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                            Download File {idx+1}
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EditEventPage() {
  return (
    <AuthGuard requiredRole="admin">
      <EditEventPageContent />
    </AuthGuard>
  )
} 