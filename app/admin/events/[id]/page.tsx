"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentClassFromBatch } from "@/lib/utils";

export default function EventDetailsPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  // 1. Add a new state for allStudents and fetch all students needed for winners and participants.
  const [allStudents, setAllStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!params.id) return
    const fetchEvent = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/events/${params.id}`)
        if (!res.ok) {
          setError("Event not found or failed to load.")
          setEvent(null)
        } else {
          const data = await res.json()
          setEvent(data)
        }
      } catch (err) {
        setError("Failed to load event details.")
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [params.id])

  useEffect(() => {
    if (!event) return;
    // Gather all unique student IDs from selectedStudents and winners
    const selectedIds = Array.isArray(event.selectedStudents) ? event.selectedStudents : [];
    const winnerIds = Array.isArray(event.winners) ? event.winners.map((w: any) => w.studentId) : [];
    const allIds = Array.from(new Set([...selectedIds, ...winnerIds].filter(Boolean)));
    if (allIds.length === 0) return;
    setParticipantsLoading(true);
    fetch("/api/students/bulk-get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: allIds }),
    })
      .then(res => res.json())
      .then(data => {
        setAllStudents(data.students || []);
        // Only set participants as those in selectedStudents
        setParticipants((data.students || []).filter((s: any) => selectedIds.includes(s.id)));
      })
      .catch(() => {
        setAllStudents([]);
        setParticipants([]);
      })
      .finally(() => setParticipantsLoading(false));
  }, [event]);

  useEffect(() => {
    if (!lightboxImg) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImg]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading event details...</div>
  }
  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center text-red-600">{error}<Button onClick={() => router.back()} className="mt-4">Go Back</Button></div>
  }
  if (!event) {
    return <div className="min-h-screen flex flex-col items-center justify-center">No event data found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Lightbox Overlay */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Preview" className="max-w-full max-h-full rounded shadow-lg border-4 border-white" onClick={e => e.stopPropagation()} />
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/events">&larr; Back to Events</Link>
        </Button>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>Event ID: {event.id || event._id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><b>Date:</b> {event.date ? new Date(event.date).toLocaleDateString('en-GB') : "-"}</div>
            <div><b>Location:</b> {event.location}</div>
            <div><b>Competition:</b> {event.isCompetition ? "Yes" : "No"}</div>
            <div><b>Chief Guest{event.isCompetition ? ' / Judge' : ''}:</b> {event.chiefGuest}</div>
            <div><b>Budget:</b> ₹{event.fundSpent}</div>
            <div><b>Description:</b> {event.description}</div>
            <div><b>Type:</b> {event.eventType}</div>
            <div><b>Status:</b> {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "-"}</div>
          </CardContent>
        </Card>
        {/* Winners & Runners Section - always show if event.winners exists */}
        {event.winners && event.winners.length > 0 && (
          <Card className="mb-4">
            <CardHeader><CardTitle>Winners & Runners</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                {event.winners.map((winner: any, idx: number) => {
                  let student = allStudents.find((s: any) => s.id === winner.studentId);
                  const isUnknown = !student || !student.name || /^[a-f0-9]{24}$/i.test(student.name);
                  return (
                    <div key={idx} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border w-48">
                      <Avatar className="h-16 w-16 mb-2">
                        <AvatarImage src={isUnknown ? "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg" : student?.photo} alt={student?.name || 'Unknown Student'} />
                        <AvatarFallback>{isUnknown ? '?' : (student?.name ? student.name.split(' ').map((n: string) => n[0]).join('') : '?')}</AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-center mb-1">{isUnknown ? 'Unknown Student' : student.name}</div>
                      <div className="text-sm text-gray-600 mb-1">{student?.rollNumber || ''}</div>
                      <div className="text-green-700 font-bold mb-1">{winner.award}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Uploaded Files Preview Section */}
        {(event.reportUrl || event.attendanceSheetUrl || (event.photoUrls && event.photoUrls.length > 0)) && (
          <Card className="mb-4">
            <CardHeader><CardTitle>Uploaded Files</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {event.reportUrl && (
                  <div>
                    <div className="font-medium mb-1">Report:</div>
                    {event.reportUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|heic)$/i) ? (
                      <a href={event.reportUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); setLightboxImg(event.reportUrl); }}>
                        <img src={event.reportUrl} alt="Report" className="w-40 h-40 object-cover rounded shadow cursor-pointer" />
                      </a>
                    ) : (
                      <a href={event.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View/Download Report</a>
                    )}
                  </div>
                )}
                {event.attendanceSheetUrl && (
                  <div>
                    <div className="font-medium mb-1">Attendance Sheet:</div>
                    {event.attendanceSheetUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|heic)$/i) ? (
                      <a href={event.attendanceSheetUrl} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); setLightboxImg(event.attendanceSheetUrl); }}>
                        <img src={event.attendanceSheetUrl} alt="Attendance Sheet" className="w-40 h-40 object-cover rounded shadow cursor-pointer" />
                      </a>
                    ) : (
              <a href={event.attendanceSheetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View/Download Attendance Sheet</a>
                    )}
                  </div>
        )}
        {event.photoUrls && event.photoUrls.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="font-medium mb-1">Event Photos:</div>
                    <div className="flex flex-wrap gap-4">
              {event.photoUrls.map((url: string, idx: number) => (
                url.match(/\.(jpg|jpeg|png|gif|bmp|webp|heic)$/i) ? (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); setLightboxImg(url); }}>
                            <img src={url} alt="Event Photo" className="w-40 h-40 object-cover rounded shadow cursor-pointer" />
                  </a>
                ) : (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">Download File {idx+1}</a>
                )
              ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Participants Table */}
        {/* 3. Always show the participants table below the photos, even if empty (show a message if no participants): */}
        <Card className="mb-4">
          <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
          <CardContent>
            {participantsLoading ? (
              <div>Loading participants...</div>
            ) : participants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border border-gray-200">Profile</th>
                      <th className="p-2 border border-gray-200">Name</th>
                      <th className="p-2 border border-gray-200">Roll</th>
                      <th className="p-2 border border-gray-200">Class</th>
                      <th className="p-2 border border-gray-200">Section</th>
                      <th className="p-2 border border-gray-200">Award/Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((student) => {
                      // Find if this student is a winner/runner
                      let award = null, position = null;
                      if (event.winners && Array.isArray(event.winners)) {
                        const winnerEntry = event.winners.find((w: any) => w.studentId === student.id);
                        if (winnerEntry) {
                          award = winnerEntry.award;
                          position = winnerEntry.position;
                        }
                      }
                      return (
                        <tr key={student.id} className={award ? "bg-yellow-50" : undefined}>
                          <td className="p-2 border border-gray-200 text-center">
                            <Avatar className="h-8 w-8 mx-auto">
                              <AvatarImage src={student.photo} alt={student.name} />
                              <AvatarFallback>{student.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                          </td>
                          <td className="p-2 border border-gray-200 font-medium">{student.name}</td>
                          <td className="p-2 border border-gray-200">{student.rollNumber}</td>
                          <td className="p-2 border border-gray-200">{getCurrentClassFromBatch(student.batch)}</td>
                          <td className="p-2 border border-gray-200">{student.section}</td>
                          <td className="p-2 border border-gray-200">
                            {award ? (
                              <span className="font-semibold text-green-700">{award}{position ? ` (Position: ${position})` : ''}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">No participants found for this event.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 