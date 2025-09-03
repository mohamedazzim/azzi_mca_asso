import { type NextRequest, NextResponse } from "next/server"
import { StudentStorage } from "@/lib/local-storage"

// Helper functions for advanced filtering
function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

function calculateAttendancePercentage(student: any): number {
  // Placeholder implementation - calculate based on attended events
  const attendedEvents = student.attendedEvents || []
  const totalEvents = student.totalEvents || 10 // Default assumption
  return totalEvents > 0 ? Math.round((attendedEvents.length / totalEvents) * 100) : 0
}

function calculatePerformanceScore(student: any): number {
  // Placeholder implementation - calculate based on achievements and scores
  const achievements = student.achievements || []
  const scores = student.scores || []
  
  let baseScore = 75 // Default base score
  
  // Add points for achievements
  achievements.forEach((achievement: any) => {
    if (achievement.type === 'first') baseScore += 10
    else if (achievement.type === 'second') baseScore += 8
    else if (achievement.type === 'third') baseScore += 5
    else baseScore += 3
  })
  
  // Average scores if available
  if (scores.length > 0) {
    const avgScore = scores.reduce((sum: number, score: any) => sum + (score.value || 0), 0) / scores.length
    baseScore = Math.round((baseScore + avgScore) / 2)
  }
  
  return Math.min(100, Math.max(0, baseScore)) // Clamp between 0-100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const batchFilter = searchParams.get("batch")
    const limit = searchParams.get("limit")
    const sectionFilter = searchParams.get("section")
    const genderFilter = searchParams.get("gender")
    const bloodGroupFilter = searchParams.get("bloodGroup")
    const hostellerFilter = searchParams.get("hosteller")
    const activeFilter = searchParams.get("active")
    const hasPhotoFilter = searchParams.get("hasPhoto")
    const minAge = searchParams.get("minAge")
    const maxAge = searchParams.get("maxAge")
    const attendanceMin = searchParams.get("attendanceMin")
    const attendanceMax = searchParams.get("attendanceMax")
    const performanceMin = searchParams.get("performanceMin")
    const performanceMax = searchParams.get("performanceMax")
    const exportFormat = searchParams.get("export") // csv, pdf
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
    if (genderFilter && genderFilter !== "all") {
      filters.gender = genderFilter
    }
    if (bloodGroupFilter && bloodGroupFilter !== "all") {
      filters.bloodGroup = bloodGroupFilter
    }
    if (hostellerFilter && hostellerFilter !== "all") {
      filters.hostellerStatus = hostellerFilter
    }
    if (activeFilter !== null && activeFilter !== "all") {
      filters.isActive = activeFilter === "true"
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
        student.phone?.toLowerCase().includes(searchLower) ||
        student.guardianName?.toLowerCase().includes(searchLower) ||
        student.address?.toLowerCase().includes(searchLower)
      )
    }

    // Apply advanced filters
    if (hasPhotoFilter === "true") {
      students = students.filter(student => student.photoUrl || student.photoPath)
    } else if (hasPhotoFilter === "false") {
      students = students.filter(student => !student.photoUrl && !student.photoPath)
    }

    // Age filter
    if (minAge || maxAge) {
      students = students.filter(student => {
        if (!student.dateOfBirth) return false
        const age = calculateAge(new Date(student.dateOfBirth))
        if (minAge && age < parseInt(minAge)) return false
        if (maxAge && age > parseInt(maxAge)) return false
        return true
      })
    }

    // Attendance filter (placeholder - implement when attendance data available)
    if (attendanceMin || attendanceMax) {
      students = students.filter(student => {
        const attendancePercentage = calculateAttendancePercentage(student)
        if (attendanceMin && attendancePercentage < parseInt(attendanceMin)) return false
        if (attendanceMax && attendancePercentage > parseInt(attendanceMax)) return false
        return true
      })
    }

    // Performance filter (placeholder - implement when performance data available)
    if (performanceMin || performanceMax) {
      students = students.filter(student => {
        const performanceScore = calculatePerformanceScore(student)
        if (performanceMin && performanceScore < parseInt(performanceMin)) return false
        if (performanceMax && performanceScore > parseInt(performanceMax)) return false
        return true
      })
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
    const contentType = request.headers.get("content-type") || ""
    let studentData: any = {}
    let photoFile: File | null = null

    // Handle both JSON and multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      
      // Extract student data from form fields
      const fields = ['name', 'rollNumber', 'email', 'phone', 'batch', 'batchYear', 'section', 'class', 'category', 'gender', 'dateOfBirth', 'address', 'guardianName', 'guardianPhone', 'bloodGroup', 'hostellerStatus']
      
      for (const field of fields) {
        const value = formData.get(field)
        if (value && typeof value === 'string') {
          studentData[field] = value
        }
      }

      // Extract photo file
      const photo = formData.get('photo')
      if (photo && photo instanceof File) {
        photoFile = photo
      }
    } else {
      studentData = await request.json()
    }
    
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
    const batchYear = studentData.batch || studentData.batchYear || new Date().getFullYear().toString()
    const newStudentData = {
      ...studentData,
      batchYear,
      isActive: studentData.isActive !== false,
      dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : new Date(),
    }

    // Handle photo upload if provided
    let photoUrl = null
    if (photoFile) {
      const { saveStudentProfilePhoto } = await import('@/lib/storage')
      const fileBuffer = Buffer.from(await photoFile.arrayBuffer())
      const photoResult = await saveStudentProfilePhoto(
        batchYear,
        studentData.rollNumber,
        fileBuffer,
        photoFile.type,
        photoFile.name
      )
      
      if (photoResult.success) {
        photoUrl = photoResult.photoUrl
        newStudentData.photoUrl = photoUrl
      } else {
        return NextResponse.json({ 
          error: "Photo upload failed", 
          message: photoResult.error || "Failed to save profile photo",
        }, { status: 400 })
      }
    }

    const studentId = await StudentStorage.saveStudent(newStudentData)

    return NextResponse.json({ 
      success: true, 
      message: "Student created successfully", 
      studentId,
      photoUrl 
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