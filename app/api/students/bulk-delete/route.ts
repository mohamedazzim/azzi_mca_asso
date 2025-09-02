import { NextRequest, NextResponse } from "next/server";
import { getStudents } from "@/lib/db";
import { ObjectId } from "mongodb";
import { StudentStorage } from "@/lib/local-storage";

export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No student IDs provided" }, { status: 400 });
    }
    
    // For local storage, validate IDs are non-empty strings
    const invalidId = ids.find((id: string) => !id || typeof id !== 'string' || id.length < 1);
    if (invalidId) {
      return NextResponse.json({ error: `Invalid student ID: ${invalidId}` }, { status: 400 });
    }
    
    // Delete students one by one
    let deletedCount = 0;
    for (const id of ids) {
      const success = await StudentStorage.deleteStudent(id);
      if (success) deletedCount++;
    }
    
    return NextResponse.json({ success: true, deletedCount: deletedCount });
  } catch (error) {
    console.error("Error bulk deleting students:", error);
    return NextResponse.json({ error: "Failed to bulk delete students" }, { status: 500 });
  }
}