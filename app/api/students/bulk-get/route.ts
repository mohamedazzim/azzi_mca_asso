import { NextRequest, NextResponse } from "next/server";
import { getStudents } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No student IDs provided" }, { status: 400 });
    }
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
    
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
} 