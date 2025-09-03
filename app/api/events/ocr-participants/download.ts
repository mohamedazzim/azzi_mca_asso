import { NextRequest, NextResponse } from "next/server";
import { MetadataStorage, EventStorage } from "@/lib/local-storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url!);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing file id" }, { status: 400 });

    // Get file metadata from local storage
    const attendanceFiles = await MetadataStorage.getMetadata('attendance_uploads') || [];
    const fileRecord = attendanceFiles.find((file: any) => file._id === id);
    
    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get file data from local storage
    const fileData = await EventStorage.getEventFile(fileRecord.filePath);
    if (!fileData) {
      return NextResponse.json({ error: "File data not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", fileRecord.mimetype || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${fileRecord.filename}"`);

    return new NextResponse(fileData.buffer, { status: 200, headers });
  } catch (err: any) {
    
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}