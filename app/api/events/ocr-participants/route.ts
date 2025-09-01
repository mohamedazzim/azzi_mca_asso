import { NextRequest, NextResponse } from "next/server";
import { EventStorage, MetadataStorage } from "@/lib/local-storage";
import { randomUUID } from "crypto";

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

    const fileId = randomUUID();
    
    // Save file to local storage
    const filePath = await EventStorage.saveEventFile(fileId, buffer, 'attendance', file.name);
    
    // Save metadata to local storage
    const attendanceFiles = await MetadataStorage.getMetadata('attendance_uploads') || [];
    const fileRecord = { ...metadata, _id: fileId, filePath };
    attendanceFiles.push(fileRecord);
    await MetadataStorage.saveMetadata('attendance_uploads', attendanceFiles);

    return NextResponse.json({
      message: "File uploaded successfully!",
      fileId: fileId,
      ...metadata,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}