import { type NextRequest, NextResponse } from "next/server"
import { getStudents, Student } from "@/lib/db"
import { ObjectId } from "mongodb"

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
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1

    const studentsCollection = await getStudents()
    const query: Record<string, unknown> = {}

    // Apply search filter (name, rollNumber, email, phone)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    // Apply batch filter
    if (batchFilter && batchFilter !== "all") {
      query.batch = batchFilter
    }

    // Apply section filter
    if (sectionFilter && sectionFilter !== "all") {
      query.section = sectionFilter
    }

    // Pagination logic
    const skip = (page - 1) * pageSize
    const total = await studentsCollection.countDocuments(query)
    const sort: any = {}
    if (["name", "rollNumber"].includes(sortField)) {
      sort[sortField] = sortOrder
    } else {
      sort["rollNumber"] = 1
    }
    const students = await studentsCollection.find(query).sort(sort).skip(skip).limit(pageSize).toArray()

    // Transform data for frontend
    const transformedStudents = students.map(student => ({
      id: student._id?.toString(),
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      phone: student.phone,
      batch: student.batch,
      section: student.section,
      gender: student.gender,
      dob: student.dateOfBirth,
      photo: student.photoData ? `/api/students/${student._id}/photo` : "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg",
      isActive: student.isActive,
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
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

// Bulk delete endpoint
export async function POST(request: NextRequest) {
  if (request.url.endsWith("/bulk-delete")) {
    // Bulk delete logic
    const role = request.headers.get("x-user-role")
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    try {
      const { ids } = await request.json()
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No student IDs provided" }, { status: 400 })
      }
      const studentsCollection = await getStudents()
      const objectIds = ids.map((id: string) => new ObjectId(id))
      const result = await studentsCollection.deleteMany({ _id: { $in: objectIds } })
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    } catch (error) {
      console.error("Error bulk deleting students:", error)
      return NextResponse.json({ error: "Failed to bulk delete students" }, { status: 500 })
    }
  }
  if (request.url.endsWith("/bulk-get")) {
    try {
      const { ids } = await request.json();
      console.log("bulk-get incoming ids:", ids);
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No student IDs provided" }, { status: 400 });
      }
      // Validate all IDs
      const invalidId = ids.find((id: string) => !/^[a-fA-F0-9]{24}$/.test(id));
      if (invalidId) {
        return NextResponse.json({ error: `Invalid student ID: ${invalidId}` }, { status: 400 });
      }
      const studentsCollection = await getStudents();
      const objectIds = ids.map((id: string) => new ObjectId(id));
      const students = await studentsCollection.find({ _id: { $in: objectIds } }).toArray();
      const result = students.map(student => ({
        id: student._id?.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        batch: student.batch,
        section: student.section,
        photo: student.photoData ? `/api/students/${student._id}/photo` : "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg",
      }));
      return NextResponse.json({ students: result });
    } catch (error) {
      console.error("Error in bulk-get:", error);
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
  }
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const studentData = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'rollNumber', 'email', 'phone', 'batch', 'section', 'dateOfBirth']
    for (const field of requiredFields) {
      if (!studentData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentData.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(studentData.phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Validate roll number format (basic validation)
    if (studentData.rollNumber.length < 3) {
      return NextResponse.json({ error: "Roll number must be at least 3 characters long" }, { status: 400 })
    }

    const studentsCollection = await getStudents()

    // Check for duplicate rollNumber
    const existingRoll = await studentsCollection.findOne({ rollNumber: studentData.rollNumber })
    if (existingRoll) {
      return NextResponse.json({ error: "Roll number already exists" }, { status: 400 })
    }
    // Check for duplicate email
    const existingEmail = await studentsCollection.findOne({ email: studentData.email })
    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Prepare student object
    const newStudent: any = {
      name: studentData.name,
      rollNumber: studentData.rollNumber,
      email: studentData.email,
      phone: studentData.phone,
      batch: studentData.batch,
      section: studentData.section,
      gender: studentData.gender,
      dateOfBirth: new Date(studentData.dateOfBirth),
      bloodGroup: studentData.bloodGroup,
      guardianName: studentData.guardianName,
      guardianPhone: studentData.guardianPhone,
      address: studentData.address,
      hostellerStatus: studentData.hostellerStatus,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await studentsCollection.insertOne(newStudent)
    newStudent._id = result.insertedId

    return NextResponse.json({
      id: newStudent._id?.toString(),
      name: newStudent.name,
      rollNumber: newStudent.rollNumber,
      email: newStudent.email,
      phone: newStudent.phone,
      batch: newStudent.batch,
      section: newStudent.section,
      gender: newStudent.gender,
      dob: newStudent.dateOfBirth,
      photo: newStudent.photoUrl || "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg",
      isActive: newStudent.isActive,
      createdAt: newStudent.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}
