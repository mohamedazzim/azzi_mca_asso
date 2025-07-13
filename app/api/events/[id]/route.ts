import { type NextRequest, NextResponse } from "next/server"
import { getEvents } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    const eventsCollection = await getEvents()
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) })
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
      id: event._id?.toString(),
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
      winners: (event as any).winners || [],
      isCompetition: (event as any).isCompetition || false,
      selectedStudents: (event as any).selectedStudents || [],
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
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    const eventsCollection = await getEvents()
    const winnersCollection = await (await import("@/lib/db")).getWinners();
    const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(id) })
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    const updateFields: Record<string, unknown> = { updatedAt: new Date() }
    if (updateData.title) updateFields.title = updateData.title
    if (updateData.eventDate) updateFields.eventDate = new Date(updateData.eventDate)
    if (updateData.location) updateFields.location = updateData.location
    if (updateData.chiefGuest !== undefined) updateFields.chiefGuest = updateData.chiefGuest
    if (updateData.fundSpent !== undefined) updateFields.fundSpent = updateData.fundSpent
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.eventType !== undefined) updateFields.eventType = updateData.eventType
    if (updateData.status !== undefined) updateFields.status = updateData.status
    if (Array.isArray(updateData.winners)) {
      updateFields.winners = updateData.winners;
      for (const w of updateData.winners) {
        if (!w.studentId) continue;
        await winnersCollection.updateOne(
          { eventId: id, studentId: w.studentId },
          { $set: {
              eventId: id,
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
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    if (result.matchedCount === 0) {
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const eventsCollection = await getEvents()
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
} 