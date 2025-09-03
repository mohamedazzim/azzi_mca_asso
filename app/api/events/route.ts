import { type NextRequest, NextResponse } from "next/server"
import { EventStorage } from "@/lib/local-storage"

function toCSV(events: any[]): string {
  const header = [
    'Title', 'Date', 'Location', 'Chief Guest', 'Fund Spent', 'Description', 'Event Type', 'Status', 'Created At'
  ]
  const rows = events.map((e: any) => [
    e.title, e.eventDate ? new Date(e.eventDate).toLocaleDateString() : '', e.location, e.chiefGuest, e.fundSpent, e.description, e.eventType, e.status, e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''
  ])
  return [header, ...rows].map((r: any[]) => r.map((x: any) => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const statusFilter = searchParams.get("status")
    const limit = searchParams.get("limit")
    const participantId = searchParams.get("participantId")
    const typeFilter = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)
    const exportCsv = searchParams.get("export") === "csv"

    // Build filters object for local storage
    const filters: any = {}
    
    if (search) {
      filters.search = search
    }
    if (statusFilter && statusFilter !== "all") {
      filters.status = statusFilter
    }
    if (typeFilter && typeFilter !== "all") {
      filters.eventType = typeFilter
    }

    // Get all events with filters
    let events = await EventStorage.getAllEvents(filters)
    
    // Apply additional filters
    if (search) {
      const searchLower = search.toLowerCase()
      events = events.filter(event => 
        event.title?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower)
      )
    }

    if (startDate || endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.eventDate)
        if (startDate && eventDate < new Date(startDate)) return false
        if (endDate && eventDate > new Date(endDate)) return false
        return true
      })
    }

    if (participantId) {
      events = events.filter(event => 
        event.participants && event.participants.includes(participantId)
      )
    }

    // Export CSV endpoint
    if (exportCsv) {
      const csv = toCSV(events)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="events.csv"',
        },
      })
    }

    // Sort events by date (most recent first)
    events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

    // Calculate total before pagination
    const total = events.length

    // Apply pagination
    const skip = (page - 1) * pageSize
    const paginatedEvents = limit ? events.slice(0, parseInt(limit)) : events.slice(skip, skip + pageSize)

    // Transform data for frontend
    const transformedEvents = paginatedEvents.map(event => {
      let status = event.status;
      if (event.eventDate && status !== 'cancelled') {
        const eventDate = new Date(event.eventDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (eventDate < today) status = 'completed';
      }

      return {
        id: event.id,
        title: event.title,
        date: event.eventDate,
        location: event.location,
        chiefGuest: event.chiefGuest,
        fundSpent: event.fundSpent,
        description: event.description,
        eventType: event.eventType,
        status,
        createdAt: event.createdAt,
        reportUrl: event.reportPath ? `/api/events/${event.id}/files/report` : null,
        attendanceSheetUrl: event.attendanceSheetPath ? `/api/events/${event.id}/files/attendance` : null,
        photoUrls: event.photoPaths || [],
        isCompetition: event.isCompetition || false,
      };
    })

    return NextResponse.json({
      events: transformedEvents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    
    // Extract form fields
    const title = formData.get("title") as string
    const eventDate = formData.get("eventDate") as string
    const location = formData.get("location") as string
    const chiefGuest = formData.get("chiefGuest") as string
    const fundSpent = parseFloat(formData.get("fundSpent") as string) || 0
    const description = formData.get("description") as string
    const eventType = formData.get("eventType") as string
    const status = formData.get("status") as string || "upcoming"

    // Validate required fields
    if (!title || !eventDate || !location) {
      return NextResponse.json({ error: "Title, date, and location are required" }, { status: 400 })
    }

    // Prepare event data
    const eventData = {
      title,
      eventDate: new Date(eventDate),
      location,
      chiefGuest,
      fundSpent,
      description,
      eventType,
      status,
      isCompetition: formData.get("isCompetition") === "true",
      photoPaths: [],
      participants: []
    }

    // Handle file uploads
    const files = {
      report: formData.get("report") as File | null,
      attendance: formData.get("attendance") as File | null,
      photos: formData.getAll("photos") as File[]
    }

    const eventId = await EventStorage.saveEvent(eventData)

    // Save uploaded files
    const filePaths: any = {}

    if (files.report && files.report.size > 0) {
      const buffer = Buffer.from(await files.report.arrayBuffer())
      filePaths.reportPath = await EventStorage.saveEventFile(eventId, eventData.eventDate, buffer, 'report', files.report.name)
    }

    if (files.attendance && files.attendance.size > 0) {
      const buffer = Buffer.from(await files.attendance.arrayBuffer())
      filePaths.attendanceSheetPath = await EventStorage.saveEventFile(eventId, eventData.eventDate, buffer, 'attendance', files.attendance.name)
    }

    if (files.photos.length > 0) {
      const photoPaths = []
      for (const photo of files.photos) {
        if (photo && photo.size > 0) {
          const buffer = Buffer.from(await photo.arrayBuffer())
          const photoPath = await EventStorage.saveEventFile(eventId, eventData.eventDate, buffer, 'photo', photo.name)
          photoPaths.push(photoPath)
        }
      }
      if (photoPaths.length > 0) {
        filePaths.photoPaths = photoPaths
      }
    }

    // Update event with file paths
    if (Object.keys(filePaths).length > 0) {
      await EventStorage.updateEvent(eventId, filePaths)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Event created successfully", 
      eventId 
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ 
      error: "Unable to create event",
      message: "Event could not be saved due to a server error. Please check all required fields and file formats, then try again.",
      details: error instanceof Error ? error.message : "Unknown server error"
    }, { status: 500 })
  }
}