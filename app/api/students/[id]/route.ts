import { type NextRequest, NextResponse } from "next/server"
import { getStudents } from "@/lib/db"
import { ObjectId } from "mongodb"
import { StudentStorage } from "@/lib/local-storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.length < 1) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }
    
    const student = await StudentStorage.getStudent(id)
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    return NextResponse.json({
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      phone: student.phone,
      class: student.class,
      batch: student.batch,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      bloodGroup: student.bloodGroup,
      category: student.category,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address,
      hostellerStatus: student.hostellerStatus,
      photoUrl: student.photoPath ? `/api/students/${student.id}/photo` : student.photoUrl,
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      section: student.section,
      participations: student.participations || [],
    })
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }
    const existingStudent = await StudentStorage.getStudent(id)
    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
      }
    }
    if (updateData.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(updateData.phone.replace(/\s/g, ''))) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
      }
    }
    if (updateData.rollNumber && updateData.rollNumber !== existingStudent.rollNumber) {
      const allStudents = await StudentStorage.getAllStudents()
      const duplicateRoll = allStudents.find(s => s.rollNumber === updateData.rollNumber && s.id !== id)
      if (duplicateRoll) {
        return NextResponse.json({ error: "Roll number already exists" }, { status: 400 })
      }
    }
    if (updateData.email && updateData.email !== existingStudent.email) {
      const allStudents = await StudentStorage.getAllStudents()
      const duplicateEmail = allStudents.find(s => s.email === updateData.email && s.id !== id)
      if (duplicateEmail) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }
    // Only update fields present in updateData, never unset photoData or related fields
    const updateFields: Record<string, unknown> = { updatedAt: new Date() }
    if (updateData.name) updateFields.name = updateData.name.trim()
    if (updateData.rollNumber) updateFields.rollNumber = updateData.rollNumber.trim()
    if (updateData.email) updateFields.email = updateData.email.trim().toLowerCase()
    if (updateData.phone) updateFields.phone = updateData.phone.trim()
    if (updateData.class) updateFields.class = updateData.class
    if (updateData.batch) updateFields.batch = updateData.batch
    if (updateData.gender !== undefined) updateFields.gender = updateData.gender
    if (updateData.dateOfBirth) updateFields.dateOfBirth = new Date(updateData.dateOfBirth)
    if (updateData.bloodGroup) updateFields.bloodGroup = updateData.bloodGroup
    if (updateData.category) updateFields.category = updateData.category
    if (updateData.guardianName) updateFields.guardianName = updateData.guardianName.trim()
    if (updateData.guardianPhone) updateFields.guardianPhone = updateData.guardianPhone.trim()
    if (updateData.address) updateFields.address = updateData.address.trim()
    if (updateData.hostellerStatus) updateFields.hostellerStatus = updateData.hostellerStatus;
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive
    if (updateData.section) updateFields.section = updateData.section
    // Update student using local storage
    const success = await StudentStorage.updateStudent(id, updateFields)
    if (!success) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: "Student updated successfully" })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get("x-user-role")
  
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }
  try {
    const { id } = await params
    
    if (!id || id.length < 1) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }
    
    const success = await StudentStorage.deleteStudent(id)
    
    if (!success) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: "Student deleted successfully" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}