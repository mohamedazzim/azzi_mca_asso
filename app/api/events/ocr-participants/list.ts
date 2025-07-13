import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("college_management");
    const filesCollection = db.collection("attendance_uploads");

    // Exclude the file buffer from the result
    const files = await filesCollection.find({}, {
      projection: { file: 0 }
    }).sort({ uploadedAt: -1 }).toArray();

    return NextResponse.json({ files });
  } catch (err: any) {
    console.error("LIST FILES ERROR:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
} 