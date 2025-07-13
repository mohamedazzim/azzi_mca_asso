import { type NextRequest, NextResponse } from "next/server"
import { getStudents } from "@/lib/db"
import { ObjectId } from "mongodb"

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

    if (!ObjectId.isValid(studentId)) {
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

    // Store in MongoDB
    const studentsCollection = await getStudents()
    
    // Try updating with ObjectId
    let result = await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { 
        $set: { 
          photoData: buffer,
          photoContentType: photo.type,
          photoFileName: photo.name,
          updatedAt: new Date()
        } 
      }
    )

    // If not matched, try with string _id
    if (result.matchedCount === 0) {
      result = await studentsCollection.updateOne(
        { _id: studentId },
        { 
          $set: { 
            photoData: buffer,
            photoContentType: photo.type,
            photoFileName: photo.name,
            updatedAt: new Date()
          } 
        }
      )
    }

    console.log('Photo upload: studentId', studentId, 'matchedCount', result.matchedCount)

    // Fetch the student after update and log photoData presence and size
    let updatedStudent = await studentsCollection.findOne({ _id: new ObjectId(studentId) })
    if (!updatedStudent) {
      updatedStudent = await studentsCollection.findOne({ _id: studentId })
    }
    if (updatedStudent && updatedStudent.photoData) {
      console.log('Photo upload: photoData present, size', updatedStudent.photoData.length)
    } else {
      console.log('Photo upload: photoData NOT present after update')
    }

    // After update, log the updated student document
    if (updatedStudent) {
      console.log('Photo upload: updated student', {
        _id: updatedStudent._id,
        photoDataType: typeof updatedStudent.photoData,
        photoDataLength: updatedStudent.photoData ? updatedStudent.photoData.length : null,
        photoContentType: updatedStudent.photoContentType,
        photoFileName: updatedStudent.photoFileName
      })
    } else {
      console.log('Photo upload: student NOT FOUND after update')
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Photo uploaded and stored in database successfully",
      photoUrl: `/api/students/${studentId}/photo`
    })

  } catch (error) {
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
} 