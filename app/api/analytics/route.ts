import { NextResponse } from "next/server"
import { getStudents, getEvents, getWinners } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    const studentsCollection = await getStudents()
    const eventsCollection = await getEvents()
    const winnersCollection = await getWinners()

    // Date range filter
    const eventQuery: Record<string, any> = {}
    if (startDate || endDate) {
      eventQuery.eventDate = {}
      if (startDate) eventQuery.eventDate.$gte = new Date(startDate)
      if (endDate) eventQuery.eventDate.$lte = new Date(endDate)
    }

    // Get basic counts
    const totalStudents = await studentsCollection.countDocuments({ isActive: true })
    const totalEvents = await eventsCollection.countDocuments(eventQuery)
    const totalWinners = await winnersCollection.countDocuments(eventQuery.eventDate ? { eventDate: eventQuery.eventDate } : {})

    // Calculate total funds spent
    const events = await eventsCollection.find(eventQuery).toArray()
    const totalFunds = events.reduce((sum, event) => sum + (event.fundSpent || 0), 0)

    // Calculate average attendance (realistic: average number of participations per event)
    let averageAttendance = 0
    if (totalEvents > 0) {
      const totalAttendance = events.reduce((sum, event) => sum + (Array.isArray((event as any).attendance) ? (event as any).attendance.length : 0), 0)
      averageAttendance = Math.round(totalAttendance / totalEvents)
    }

    // Monthly trends for the last 6 months (real data)
    const monthlyTrends = []
    const currentDate = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const monthEvents = events.filter(e => e.eventDate >= date && e.eventDate < nextMonth)
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const participants = monthEvents.reduce((sum, e) => sum + (Array.isArray((e as any).attendance) ? (e as any).attendance.length : 0), 0)
      const budget = monthEvents.reduce((sum, e) => sum + (e.fundSpent || 0), 0)
      monthlyTrends.push({
        month: monthName,
        events: monthEvents.length,
        participants,
        budget
      })
    }

    // Top performers (students with most awards)
    // Only include winners whose eventId matches an existing event
    const existingEventIds = new Set(events.map(e => e._id?.toString()))
    const winners = await winnersCollection.find(eventQuery.eventDate ? { eventDate: eventQuery.eventDate } : {}).toArray()
    const winnerMap: Record<string, { id: string, name: string, rollNumber: string, events: number, awards: number, photo?: string }> = {}
    for (const w of winners) {
      if (!w.studentId) continue
      // Only count if winner's eventId is in existing events
      if (!w.eventId || !existingEventIds.has(w.eventId.toString())) continue;
      let student = null;
      try {
        student = await studentsCollection.findOne({ _id: new ObjectId(w.studentId) })
      } catch (e) {
        // ignore invalid ObjectId
      }
      if (!student) continue; // Only count if student exists
      if (!winnerMap[w.studentId]) {
        winnerMap[w.studentId] = {
          id: student._id?.toString(),
          name: student.name,
          rollNumber: student.rollNumber,
          events: 0,
          awards: 0,
          photo: student.photoData ? `/api/students/${student._id}/photo` : (student.photoUrl || "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg")
        }
      }
      winnerMap[w.studentId].awards += 1
      winnerMap[w.studentId].events += 1 // For simplicity, count each win as an event
    }
    const topPerformers = Object.values(winnerMap)
      .sort((a, b) => b.awards - a.awards)
      .slice(0, 5)

    // Event types analysis
    const eventTypeMap: Record<string, { count: number, participation: number }> = {}
    for (const e of events) {
      const type = e.eventType || 'General'
      if (!eventTypeMap[type]) eventTypeMap[type] = { count: 0, participation: 0 }
      eventTypeMap[type].count += 1
      eventTypeMap[type].participation += Array.isArray((e as any).attendance) ? (e as any).attendance.length : 0
    }
    const eventTypes = Object.entries(eventTypeMap).map(([type, data]) => ({
      type,
      count: data.count,
      participation: data.participation
    }))

    return NextResponse.json({
      overview: {
        totalStudents,
        totalEvents,
        totalParticipations: events.reduce((sum, e) => sum + (Array.isArray((e as any).attendance) ? (e as any).attendance.length : 0), 0),
        totalWinners,
        averageAttendance,
        budgetUtilized: totalFunds
      },
      monthlyTrends,
      topPerformers,
      eventTypes
    })
  } catch (error) {
    return NextResponse.json({ 
      overview: {
        totalStudents: 0,
        totalEvents: 0,
        totalParticipations: 0,
        totalWinners: 0,
        averageAttendance: 0,
        budgetUtilized: 0
      },
      monthlyTrends: [],
      topPerformers: [],
      eventTypes: []
    })
  }
}
