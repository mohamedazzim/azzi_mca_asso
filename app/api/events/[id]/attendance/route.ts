import { NextRequest, NextResponse } from "next/server"
import { getEvents, getStudents } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id: eventId } = await params
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }
    const { studentIds } = await request.json()
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "No students provided" }, { status: 400 })
    }
    const studentsCollection = await getStudents()
    const eventsCollection = await getEvents()
    let added = 0, updated = 0, errors: string[] = []
    for (const studentId of studentIds) {
      if (!ObjectId.isValid(studentId)) {
        errors.push(`Invalid student ID: ${studentId}`)
        continue
      }
      // Check if already marked present
      const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })
      if (!event) {
        errors.push(`Event not found: ${eventId}`)
        continue
      }
      if (!(event as any).attendance) (event as any).attendance = []
      if ((event as any).attendance.some((sid: any) => sid.toString() === studentId)) {
        updated++
        continue
      }
      (event as any).attendance.push(new ObjectId(studentId))
      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: { attendance: (event as any).attendance, updatedAt: new Date() } }
      )
      // Optionally, update student profile with attended event
      await studentsCollection.updateOne(
        { _id: new ObjectId(studentId) },
        { $addToSet: { attendedEvents: new ObjectId(eventId) }, $set: { updatedAt: new Date() } }
      )
      added++
    }
    return NextResponse.json({ added, updated, errors })
  } catch (error) {
    console.error("Attendance save error:", error)
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 })
  }
} 