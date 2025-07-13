import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = {
      filename: file.name,
      mimetype: file.type,
      size: buffer.length,
      uploadedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("college_management");
    const filesCollection = db.collection("attendance_uploads");

    const result = await filesCollection.insertOne({
      ...metadata,
      file: buffer,
    });

    return NextResponse.json({
      message: "File uploaded successfully!",
      fileId: result.insertedId,
      ...metadata,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
