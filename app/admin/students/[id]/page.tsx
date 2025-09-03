"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { getCurrentClassFromBatch, getUserRole } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Student {
  id: string
  name: string
  rollNumber: string
  email: string
  phone: string
  class: string
  batch: string
  gender: string
  dateOfBirth: string
  photoUrl?: string
  address?: string
  guardianName?: string
  guardianPhone?: string
  admissionDate?: string
  bloodGroup?: string
  category?: string
  section?: string
  hostellerStatus?: string;
}

function StudentDetailPageContent() {
  const params = useParams()
  const studentId = params.id as string
  const { toast } = useToast()
  const { canEdit } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [participatedEvents, setParticipatedEvents] = useState<unknown[]>([])
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (studentId) {
      const fetchStudent = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/students/${studentId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch student data')
          }
          const data = await response.json()
          setStudent(data)
        } catch (error) {
          console.error('Error fetching student:', error)
          toast({
            title: "Error",
            description: "Failed to fetch student data",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      fetchStudent()
    }
  }, [studentId, toast])

  useEffect(() => {
    async function fetchParticipatedEvents() {
      if (!student?.id) return;
      const response = await fetch(`/api/events?participantId=${student.id}`)
      if (response.ok) {
        const data = await response.json()
        setParticipatedEvents(data)
      }
    }
    fetchParticipatedEvents()
  }, [student?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading student data...</span>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Student not found</p>
          <Link href="/admin/students">
            <Button className="mt-4">Back to Students</Button>
          </Link>
        </div>
      </div>
    )
  }

  const participations = (student as any).participations || [];

  // Merge participations and participatedEvents for a unified, deduplicated list
  const allParticipations = [
    ...participations.map((p: any) => ({
      eventId: p.eventId?.toString?.() || p.eventId || '',
      eventTitle: p.eventTitle || '',
      date: p.date ? new Date(p.date) : null,
      eventType: p.eventType || '',
      award: p.award,
      position: p.position,
    })),
    ...((Array.isArray(participatedEvents) ? participatedEvents : []).map((e: any) => ({
      eventId: e.id || '',
      eventTitle: e.title || '',
      date: e.eventDate ? new Date(e.eventDate) : null,
      eventType: e.eventType || '',
      award: e.award,
      position: e.position,
    })))
  ].filter((v, i, arr) => v.eventId && arr.findIndex(x => x.eventId === v.eventId) === i)
    .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/students">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Students
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                <p className="text-gray-600 mb-2">
                  {getCurrentClassFromBatch(student.batch, student.section)}
                  {student.batch ? ` • ${student.batch}` : ''}
                  {student.section ? ` • Section ${student.section}` : ''}
                </p>
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center space-x-2">
                <Link href={`/admin/students/${student.id}/edit`}>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={deleting}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={`/api/students/${student.id}/photo`} alt={student.name} />
                  <AvatarFallback className="text-lg">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{student.name}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mb-2">
                    {(student as any).rollNumber}
                  </Badge>
                  <br />
                  {(student as any).class} • {(student as any).batch}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{(student as any).email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{(student as any).phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      DOB: {new Date((student as any).dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  {(student as any).bloodGroup && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Blood Group: {(student as any).bloodGroup}</span>
                    </div>
                  )}
                </div>

                {(student as any).guardianName && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Guardian Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Name:</strong> {(student as any).guardianName}
                      </p>
                      {(student as any).guardianPhone && (
                        <p>
                          <strong>Phone:</strong> {(student as any).guardianPhone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Academic Information</h4>
                  <div className="space-y-2 text-sm">
                    {(student as any).hostellerStatus && (
                      <p>
                        <strong>Hosteller/Dayscholar:</strong> {(student as any).hostellerStatus}
                      </p>
                    )}
                    {(student as any).category && (
                      <p>
                        <strong>Category:</strong> {(student as any).category}
                      </p>
                    )}
                    <p>
                      <strong>Gender:</strong> {(student as any).gender}
                    </p>
                  </div>
                </div>

                {(student as any).address && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Address</h4>
                    <p className="text-sm">{(student as any).address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Participation History Table */}
            {allParticipations.length > 0 && (
              <Card className="mt-8">
              <CardHeader>
                <CardTitle>Participation History</CardTitle>
                  <CardDescription>All events and competitions attended by this student</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2">Event</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Award/Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allParticipations.map((p, idx) => (
                          <tr key={p.eventId + idx}>
                            <td className="p-2">{p.eventTitle}</td>
                            <td className="p-2">{p.date ? p.date.toLocaleDateString() : '-'}</td>
                            <td className="p-2">{p.eventType || '-'}</td>
                            <td className="p-2">
                              {p.award ? (
                                <span className="font-semibold text-green-700">{p.award}{p.position ? ` (Position: ${p.position})` : ''}</span>
                ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
        {/* Remove the old Participated Events section */}
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this student? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={async () => {
              setDeleting(true);
              try {
                const userRole = getUserRole();
                
                const res = await fetch(`/api/students/${student.id}`, {
                  method: "DELETE",
                  headers: { 
                    "x-user-role": userRole,
                    "Content-Type": "application/json"
                  },
                });
                
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || "Failed to delete student");
                }
                
                toast({
                  title: "Student deleted",
                  description: "The student has been deleted successfully.",
                  variant: "default",
                });
                setDeleteDialogOpen(false);
                router.push("/admin/students");
              } catch (error: any) {
                console.error("Delete error:", error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to delete student",
                  variant: "destructive",
                });
              } finally {
                setDeleting(false);
              }
            }} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StudentDetailPage() {
  return (
    <AuthGuard>
      <StudentDetailPageContent />
    </AuthGuard>
  )
}
