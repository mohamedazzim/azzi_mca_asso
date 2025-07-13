import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url!);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing file id" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("college_management");
    const filesCollection = db.collection("attendance_uploads");

    const fileDoc = await filesCollection.findOne({ _id: new ObjectId(id) });
    if (!fileDoc) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const headers = new Headers();
    headers.set("Content-Type", fileDoc.mimetype || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename=\"${fileDoc.filename}\"`);

    return new NextResponse(fileDoc.file.buffer, { status: 200, headers });
  } catch (err: any) {
    console.error("DOWNLOAD FILE ERROR:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
} 