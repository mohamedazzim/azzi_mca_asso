import { type NextRequest, NextResponse } from "next/server"
import { getEvents, Event } from "@/lib/db"
import path from "path"
import fs from "fs/promises"
import { mkdirSync, existsSync } from "fs"
import { ObjectId } from "mongodb"
import { getStudents } from "@/lib/db"
import cloudinary from '../../lib/cloudinary';

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

    const eventsCollection = await getEvents()
    const query: Record<string, any> = {}

    // Apply search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      query.status = statusFilter
    }
    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      query.eventType = typeFilter
    }
    // Apply date range filter
    if (startDate || endDate) {
      query.eventDate = {}
      if (startDate) (query.eventDate as Record<string, any>)["$gte"] = new Date(startDate)
      if (endDate) (query.eventDate as Record<string, any>)["$lte"] = new Date(endDate)
    }
    if (participantId) {
      query["participants"] = participantId
    }

    // Export CSV endpoint
    if (exportCsv) {
      const allEvents = await eventsCollection.find(query).sort({ eventDate: -1 }).toArray()
      const csv = toCSV(allEvents)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="events.csv"',
        },
      })
    }

    // Pagination logic
    const skip = (page - 1) * pageSize
    const total = await eventsCollection.countDocuments(query)
    const events = await eventsCollection.find(query).sort({ eventDate: -1 }).skip(skip).limit(pageSize).toArray()

    // Transform data for frontend
    const transformedEvents = events.map(event => {
      let status = event.status;
      if (event.eventDate && status !== 'cancelled') {
        const eventDate = new Date(event.eventDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (eventDate < today) status = 'completed';
      }
      // Ensure reportUrl is a Cloudinary URL or null
      let reportUrl = event.reportUrl || null;
      if (reportUrl && reportUrl.startsWith('/uploads/')) {
        // Option 1: Set to null to avoid broken links
        reportUrl = null;
        // Option 2: If you have a mapping from local to Cloudinary, you can set it here
        // reportUrl = mapLocalToCloudinary(reportUrl);
      }
      return {
        id: event._id?.toString(),
        title: event.title,
        date: event.eventDate,
        location: event.location,
        chiefGuest: event.chiefGuest,
        fundSpent: event.fundSpent,
        description: event.description,
        status,
        createdAt: event.createdAt,
        reportUrl,
        attendanceSheetUrl: event.attendanceSheetUrl || null,
        photoUrls: event.photoUrls || [],
        isCompetition: (event as any).isCompetition || false,
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
  let uploadedFiles: string[] = []
  try {
    let eventData: any = {}
    let reportUrl = null
    let attendanceUrl = null
    let photoUrls: string[] = []
    let attendanceList: any[] = []
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      eventData.title = formData.get("title")?.toString() || ""
      eventData.eventDate = formData.get("eventDate")?.toString() || ""
      eventData.location = formData.get("location")?.toString() || ""
      eventData.chiefGuest = formData.get("chiefGuest")?.toString() || ""
      eventData.fundSpent = formData.get("fundSpent")?.toString() || ""
      eventData.description = formData.get("description")?.toString() || ""
      eventData.winners = formData.get("winners") ? JSON.parse(formData.get("winners") as string) : []
      eventData.selectedStudents = formData.get("selectedStudents") ? JSON.parse(formData.get("selectedStudents") as string) : [];
      eventData.isCompetition = formData.get("isCompetition") === 'true'; // Store competition status
      // Cloudinary upload helper
      async function uploadToCloudinary(file: File, folder: string): Promise<string> {
        const buffer = Buffer.from(await file.arrayBuffer());
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: file.type.startsWith('image/') ? 'image' : 'auto',
            public_id: Date.now() + '-' + String(file.name).replace(/\s+/g, '_'),
          }, (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          });
          stream.end(buffer);
        });
      }
      // Report
      const report = formData.get("report") as File | null
      if (report && report.size > 0) {
        const allowed = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg", "image/png", "image/jpg", "image/gif", "image/bmp", "image/webp", "image/heic"
        ]
        if (!allowed.includes(report.type)) {
          return NextResponse.json({ error: "Invalid report file type. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, BMP, WEBP, HEIC." }, { status: 400 })
        }
        if (report.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: "Report file too large (max 5MB)." }, { status: 400 })
        }
        reportUrl = await uploadToCloudinary(report, 'events/reports');
      }
      // Attendance
      const attendance = formData.get("attendance") as File | null
      if (attendance && attendance.size > 0) {
        const allowed = [
          "application/pdf",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/jpeg", "image/png", "image/jpg", "image/gif", "image/bmp", "image/webp", "image/heic"
        ]
        if (!allowed.includes(attendance.type)) {
          return NextResponse.json({ error: "Invalid attendance file type. Allowed: PDF, XLS, XLSX, JPG, PNG, GIF, BMP, WEBP, HEIC." }, { status: 400 })
        }
        if (attendance.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: "Attendance file too large (max 5MB)." }, { status: 400 })
        }
        attendanceUrl = await uploadToCloudinary(attendance, 'events/attendance');
      }
      // Photos (multiple)
      const photos = formData.getAll("photos") as File[]
      if (photos.length > 5) {
        return NextResponse.json({ error: "You can upload a maximum of 5 photos." }, { status: 400 })
      }
      for (const photo of photos) {
        if (photo && photo.size > 0) {
          const allowed = [
            "image/jpeg", "image/png", "image/jpg", "image/gif", "image/bmp", "image/webp", "image/heic", "application/pdf"
          ]
          if (!allowed.includes(photo.type)) {
            return NextResponse.json({ error: "Invalid photo file type. Allowed: JPG, PNG, GIF, BMP, WEBP, HEIC, PDF." }, { status: 400 })
          }
          if (photo.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Photo file too large (max 5MB)." }, { status: 400 })
          }
          const url = await uploadToCloudinary(photo, 'events/photos');
          photoUrls.push(url);
        }
      }
    } else {
      eventData = await request.json()
      if (eventData.attendance) {
        attendanceList = eventData.attendance
      }
    }
    // Validate required fields
    const requiredFields = ['title', 'eventDate', 'location']
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }
    const eventsCollection = await getEvents()
    const studentsCollection = await getStudents()
    const winnersCollection = await (await import("@/lib/db")).getWinners();
    const newEvent: any = {
      title: eventData.title,
      eventDate: new Date(eventData.eventDate),
      location: eventData.location,
      chiefGuest: eventData.chiefGuest,
      fundSpent: eventData.fundSpent || 0,
      description: eventData.description,
      eventType: eventData.eventType || 'General',
      attendanceSheetUrl: attendanceUrl,
      reportUrl: reportUrl,
      photoUrls: photoUrls,
      winners: eventData.winners || [],
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
      selectedStudents: eventData.selectedStudents || [], // FIXED: save as selectedStudents
      isCompetition: eventData.isCompetition, // Save competition status
    }
    const result = await eventsCollection.insertOne(newEvent)
    newEvent._id = result.insertedId
    // Insert winners into winners collection
    if (Array.isArray(newEvent.winners) && newEvent.winners.length > 0) {
      for (const w of newEvent.winners) {
        if (!w.studentId) continue;
        await winnersCollection.updateOne(
          { eventId: newEvent._id.toString(), studentId: w.studentId },
          { $set: {
              eventId: newEvent._id.toString(),
              studentId: w.studentId,
              awardTitle: w.award || '',
              position: w.position,
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }
    // Update each student's profile with participation
    if (eventData.selectedStudents && eventData.selectedStudents.length > 0) {
      for (const studentId of eventData.selectedStudents) {
        // Check if this student is a winner/runner
        let award = null;
        let position = null;
        if (Array.isArray(eventData.winners)) {
          const winnerEntry = eventData.winners.find((w: any) => w.studentId === studentId);
          if (winnerEntry) {
            award = winnerEntry.award;
            position = winnerEntry.position;
          }
        }
        await studentsCollection.updateOne(
          { _id: new ObjectId(studentId) },
          { $addToSet: { participations: { eventId: newEvent._id, eventTitle: newEvent.title, date: newEvent.eventDate, award, position } } }
        )
      }
    }
    return NextResponse.json({
      id: newEvent._id?.toString(),
      title: newEvent.title,
      date: newEvent.eventDate,
      location: newEvent.location,
      chiefGuest: newEvent.chiefGuest,
      fundSpent: newEvent.fundSpent,
      description: newEvent.description,
      eventType: newEvent.eventType,
      status: newEvent.status,
      attendanceSheetUrl: newEvent.attendanceSheetUrl,
      reportUrl: newEvent.reportUrl,
      photoUrls: newEvent.photoUrls,
      attendance: newEvent.attendance,
      createdAt: newEvent.createdAt,
    }, { status: 201 })
  } catch (error) {
    // Cleanup orphaned files
    if (uploadedFiles.length > 0) {
      for (const filePath of uploadedFiles) {
        try { await fs.unlink(filePath) } catch {}
      }
    }
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    const eventsCollection = await getEvents()
    const winnersCollection = await (await import("@/lib/db")).getWinners();
    const studentsCollection = await getStudents();
    // Remove event
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    // Remove all winners for this event
    await winnersCollection.deleteMany({ eventId: id })
    // Remove participations for this event from all students
    await studentsCollection.updateMany(
      { "participations.eventId": new ObjectId(id) },
      { $pull: { participations: { eventId: new ObjectId(id) } } }
    )
    return NextResponse.json({ success: true, message: "Event and related stats deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
