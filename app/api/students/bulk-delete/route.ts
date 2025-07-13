import { NextRequest, NextResponse } from "next/server";
import { getStudents } from "@/lib/db";
import { ObjectId } from "mongodb";

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
    // Validate all IDs
    const invalidId = ids.find((id: string) => !/^[a-fA-F0-9]{24}$/.test(id));
    if (invalidId) {
      return NextResponse.json({ error: `Invalid student ID: ${invalidId}` }, { status: 400 });
    }
    const studentsCollection = await getStudents();
    const objectIds = ids.map((id: string) => new ObjectId(id));
    const result = await studentsCollection.deleteMany({ _id: { $in: objectIds } });
    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error bulk deleting students:", error);
    return NextResponse.json({ error: "Failed to bulk delete students" }, { status: 500 });
  }
} 