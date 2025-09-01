import { type NextRequest, NextResponse } from "next/server"
import { StudentStorage } from "@/lib/local-storage"
import path from "path"

// Default placeholder image as base64 SVG
const DEFAULT_AVATAR_SVG = `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="150" height="150" fill="#E5E7EB"/>
<circle cx="75" cy="60" r="25" fill="#9CA3AF"/>
<path d="M75 90C95 90 110 105 110 125H40C40 105 55 90 75 90Z" fill="#9CA3AF"/>
</svg>`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || id.length < 1) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }

    console.log('Photo fetch: trying to get photo for student ID', id)

    const photoData = await StudentStorage.getStudentPhoto(id)
    
    if (!photoData) {
      console.log('Photo fetch: no photo found, returning default avatar')
      // Return default avatar as SVG
      return new NextResponse(DEFAULT_AVATAR_SVG, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      })
    }

    console.log('Photo fetch: found photo, size:', photoData.buffer.length)

    // Return the photo as a response with proper content type
    return new NextResponse(photoData.buffer, {
      headers: {
        'Content-Type': photoData.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': photoData.buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("Error fetching student photo:", error)
    // Return default avatar on error
    return new NextResponse(DEFAULT_AVATAR_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}