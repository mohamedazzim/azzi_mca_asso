import { type NextRequest, NextResponse } from "next/server"
import { getEvents, getWinners } from "@/lib/db"
import { ObjectId } from "mongodb"
import { EventStorage } from "@/lib/local-storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.length < 1) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    
    const event = await EventStorage.getEvent(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    
    let status = event.status;
    if (event.eventDate && status !== 'cancelled') {
      const eventDate = new Date(event.eventDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (eventDate < today) status = 'completed';
    }
    return NextResponse.json({
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
      updatedAt: event.updatedAt,
      reportUrl: event.reportUrl || null,
      attendanceSheetUrl: event.attendanceSheetUrl || null,
      photoUrls: event.photoUrls || [],
      winners: event.winners || [],
      isCompetition: event.isCompetition || false,
      selectedStudents: event.selectedStudents || [],
    })
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = await params
    const updateData = await request.json()
    if (!id || id.length < 1) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    
    const existingEvent = await EventStorage.getEvent(id)
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    
    const updateFields: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (updateData.title) updateFields.title = updateData.title
    if (updateData.eventDate) updateFields.eventDate = new Date(updateData.eventDate).toISOString()
    if (updateData.location) updateFields.location = updateData.location
    if (updateData.chiefGuest !== undefined) updateFields.chiefGuest = updateData.chiefGuest
    if (updateData.fundSpent !== undefined) updateFields.fundSpent = updateData.fundSpent
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.eventType !== undefined) updateFields.eventType = updateData.eventType
    if (updateData.status !== undefined) updateFields.status = updateData.status
    if (Array.isArray(updateData.winners)) {
      updateFields.winners = updateData.winners;
    }
    if (Array.isArray(updateData.selectedStudents)) {
      updateFields.selectedStudents = updateData.selectedStudents;
    }
    if (updateData.isCompetition !== undefined) updateFields.isCompetition = updateData.isCompetition
    
    const success = await EventStorage.updateEvent(id, updateFields)
    if (!success) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: "Event updated successfully" })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = await params

    if (!id || id.length < 1) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const success = await EventStorage.deleteEvent(id)

    if (!success) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}