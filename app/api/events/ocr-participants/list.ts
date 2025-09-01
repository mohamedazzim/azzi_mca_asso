import { NextRequest, NextResponse } from "next/server";
import { MetadataStorage } from "@/lib/local-storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get file metadata from local storage (exclude file paths for security)
    const attendanceFiles = await MetadataStorage.getMetadata('attendance_uploads') || [];
    
    // Remove file paths from the response for security
    const files = attendanceFiles.map(({ filePath, ...fileInfo }: any) => fileInfo)
                                .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ files });
  } catch (err: any) {
    console.error("LIST FILES ERROR:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}