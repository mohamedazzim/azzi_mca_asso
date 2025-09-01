import { type NextRequest, NextResponse } from "next/server"
import { StudentStorage } from "@/lib/local-storage"

console.log('UPLOAD API CALLED') 
export async function POST(request: NextRequest) {
  console.log('UPLOAD API CALLED') 
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const formData = await request.formData()
    const photo = formData.get("photo") as File
    const studentId = formData.get("studentId") as string

    // Log all formData keys
    console.log('Photo upload: formData keys', Array.from(formData.keys()))
    if (!photo) {
      console.log('Photo upload: NO PHOTO in formData')
    } else {
      console.log('Photo upload: received file', photo.name, 'type', photo.type, 'size', photo.size)
    }

    if (!photo) {
      return NextResponse.json({ error: "No photo uploaded" }, { status: 400 })
    }

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    // Validate student ID (no longer using ObjectId)
    if (!studentId || studentId.length < 1) {
      return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, and WebP are allowed" }, { status: 400 })
    }

    // Validate file size (2MB limit)
    if (photo.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size should be less than 2MB" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Photo upload: received file', photo.name, 'type', photo.type, 'size', buffer.length)

    // Check if student exists
    const student = await StudentStorage.getStudent(studentId)
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Save photo to local storage
    try {
      const photoPath = await StudentStorage.saveStudentPhoto(studentId, buffer, photo.type, photo.name)
      console.log('Photo upload: saved to path', photoPath)

      return NextResponse.json({ 
        success: true, 
        message: "Photo uploaded and stored locally successfully",
        photoUrl: `/api/students/${studentId}/photo`
      })
    } catch (saveError) {
      console.error('Photo upload: save error', saveError)
      return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
    }

  } catch (error) {
    console.error('Photo upload: general error', error)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}