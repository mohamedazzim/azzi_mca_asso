import { type NextRequest, NextResponse } from "next/server"
import { StudentStorage } from "@/lib/local-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const batchFilter = searchParams.get("batch")
    const limit = searchParams.get("limit")
    const sectionFilter = searchParams.get("section")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)
    const sortField = searchParams.get("sortField") || "rollNumber"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    // Build filters object for local storage
    const filters: any = {}
    
    if (search) {
      filters.search = search
    }
    if (batchFilter && batchFilter !== "all") {
      filters.batchYear = batchFilter
    }
    if (sectionFilter && sectionFilter !== "all") {
      filters.section = sectionFilter
    }

    // Get all students with filters
    let students = await StudentStorage.getAllStudents(filters)
    
    // Apply additional search filter if needed
    if (search) {
      const searchLower = search.toLowerCase()
      students = students.filter(student => 
        student.name?.toLowerCase().includes(searchLower) ||
        student.rollNumber?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    students.sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Calculate total before pagination
    const total = students.length

    // Apply pagination
    const skip = (page - 1) * pageSize
    const paginatedStudents = limit ? students.slice(0, parseInt(limit)) : students.slice(skip, skip + pageSize)

    // Transform data for frontend
    const transformedStudents = paginatedStudents.map(student => ({
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      phone: student.phone,
      batch: student.batch || student.batchYear,
      section: student.section,
      gender: student.gender,
      dob: student.dateOfBirth,
      photo: student.photoPath ? `/api/students/${student.id}/photo` : null,
      isActive: student.isActive !== false, // default to true if not specified
      createdAt: student.createdAt,
    }))

    return NextResponse.json({
      students: transformedStudents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ 
      error: "Unable to retrieve student data",
      message: "Database connection failed or data corruption detected. Please try again or contact support.",
      details: error instanceof Error ? error.message : "Unknown database error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const studentData = await request.json()
    
    // Validate required fields
    if (!studentData.name || !studentData.rollNumber || !studentData.email) {
      return NextResponse.json({ 
      error: "Missing required information", 
      message: "Please provide all required fields: Student Name, Roll Number, and Email Address.",
      fields: ["name", "rollNumber", "email"]
    }, { status: 400 })
    }

    // Check if student with same roll number already exists
    const existingStudents = await StudentStorage.getAllStudents()
    const existingStudent = existingStudents.find(s => s.rollNumber === studentData.rollNumber)
    if (existingStudent) {
      return NextResponse.json({ 
      error: "Duplicate roll number detected", 
      message: `A student with roll number '${studentData.rollNumber}' already exists in the system. Please use a different roll number.`,
      conflictField: "rollNumber"
    }, { status: 400 })
    }

    // Prepare student data
    const newStudentData = {
      ...studentData,
      batchYear: studentData.batch || studentData.batchYear || new Date().getFullYear().toString(),
      isActive: studentData.isActive !== false,
      dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : new Date(),
    }

    const studentId = await StudentStorage.saveStudent(newStudentData)

    return NextResponse.json({ 
      success: true, 
      message: "Student created successfully", 
      studentId 
    })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ 
      error: "Unable to create student record",
      message: "Student data could not be saved due to a server error. Please check all required fields and try again.",
      details: error instanceof Error ? error.message : "Unknown server error"
    }, { status: 500 })
  }
}