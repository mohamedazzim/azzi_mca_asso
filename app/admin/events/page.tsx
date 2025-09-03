"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Calendar, MapPin, ArrowLeft, Loader2, Download, Eye } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image';
import { memo } from 'react';
import { useAuth } from "@/hooks/useAuth"

interface Event {
  id: string
  title: string
  date: string
  location: string
  chiefGuest?: string
  fundSpent: number
  description?: string
  eventType?: string
  status: string
  createdAt: string
  isCompetition?: boolean; // Added for competition status
}

function EventsPageContent() {
  const { toast } = useToast()
  const { canEdit } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      const response = await fetch(`/api/events?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      const data = await response.json()
      setEvents(data.events)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, typeFilter, startDate, endDate, toast, page, pageSize])

  // Delete event
  const deleteEvent = async (id: string) => {
    try {
      setDeletingId(id)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user.role || '',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
      
      // Refresh the list
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Fetch events on component mount and when search changes
  useEffect(() => {
    fetchEvents()
  }, [searchTerm, fetchEvents])

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage)
  }

  // Export events as CSV
  const handleExport = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (statusFilter !== 'all') params.append('status', statusFilter)
    if (typeFilter !== 'all') params.append('type', typeFilter)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    params.append('export', 'csv')
    window.open(`/api/events?${params.toString()}`, '_blank')
  }

  const handleView = (id: string) => {
    window.location.href = `/admin/events/${id}`;
  };

  const handleEdit = (id: string) => {
    window.location.href = `/admin/events/${id}/edit`;
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
  };

  const EventRow = memo(function EventRow({ event, onView, onEdit, onDelete, loading, canEdit }: {
    event: Event;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    loading: boolean;
    canEdit: boolean;
  }) {
    return (
      <TableRow key={event.id}>
        <TableCell>
          <div>
            <p className="font-medium">&quot;{event.title}&quot;</p>
            <p className="text-sm text-gray-600">Event ID: {event.id}</p>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="flex items-center text-sm">
              <Calendar className="mr-1 h-3 w-3" />
              {event.date ? new Date(event.date).toLocaleDateString('en-GB') : "-"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-3 w-3" />
              {event.location}
            </div>
          </div>
        </TableCell>
        <TableCell>{event.chiefGuest || "Not specified"}</TableCell>
        <TableCell>₹{event.fundSpent.toLocaleString()}</TableCell>
        <TableCell>
          <Badge variant={event.status === "completed" ? "default" : "secondary"}>
            {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "-"}
          </Badge>
        </TableCell>
        <TableCell>
          {event.isCompetition ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}
        </TableCell>
        <TableCell className="event-actions" onClick={e => e.stopPropagation()}>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onView(event.id)}>
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(event.id)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{event.title}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(event.id)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  });

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
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
                <p className="text-gray-600">Manage all department events</p>
              </div>
            </div>
            {canEdit && (
              <Link href="/admin/events/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events by title, location, or description..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            {/* Remove status, type, and one date filter */}
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="border rounded px-2 py-1" />
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <div className="text-sm text-gray-600">
              Total: {loading ? "..." : total} events
            </div>
          </CardContent>
        </Card>
        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Events List</CardTitle>
            <CardDescription>All department events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-24" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-28" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-48" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-20" />
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-24" />
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableCell>
                      <TableCell><div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full" /></TableCell>
                      <TableCell><div className="h-6 w-20 bg-gray-200 animate-pulse rounded-full" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Details</TableHead>
                      <TableHead>Date & Location</TableHead>
                      <TableHead>Chief Guest</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event: Event) => (
                      <EventRow key={event.id} event={event} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} loading={deletingId === event.id} canEdit={canEdit} />
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Prev</Button>
                  <span>Page {page} of {totalPages}</span>
                  <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next</Button>
                </div>
                {filteredEvents.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    No events found matching your criteria.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <AuthGuard>
      <EventsPageContent />
    </AuthGuard>
  )
}
