import { type NextRequest, NextResponse } from "next/server"
import { getStudents } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }

    const studentsCollection = await getStudents()
    let student = await studentsCollection.findOne({ _id: new ObjectId(id) })
    if (!student) {
      student = await studentsCollection.findOne({ _id: id })
      console.log('Photo fetch: tried string _id', id, 'found:', !!student)
    } else {
      console.log('Photo fetch: tried ObjectId _id', id, 'found:', !!student)
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    if (!student.photoData) {
      // Return a placeholder image instead of an error
      return NextResponse.redirect("https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg");
    }

    // Convert to Buffer if needed
    let buffer: Buffer
    if (Buffer.isBuffer(student.photoData)) {
      buffer = student.photoData
    } else if (
      typeof student.photoData === 'object' &&
      student.photoData !== null &&
      '_bsontype' in student.photoData &&
      (student.photoData as any)._bsontype === 'Binary' &&
      'buffer' in student.photoData
    ) {
      buffer = Buffer.from((student.photoData as any).buffer)
    } else {
      buffer = Buffer.from(student.photoData as Buffer)
    }

    // Return the photo as a response with proper content type
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': student.photoContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("Error fetching student photo:", error)
    // Return a placeholder image on error instead of JSON error
    return NextResponse.redirect("https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg");
  }
} 