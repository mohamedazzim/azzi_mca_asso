import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { sanitizePath } from '@/lib/storage';

const STORAGE_BASE = process.env.STORAGE_BASE_PATH || './storage';

// Security function to validate file paths
function validateFilePath(requestedPath: string): { isValid: boolean; safePath?: string; error?: string } {
  try {
    // Remove any leading slashes and decode URI components
    const cleanPath = decodeURIComponent(requestedPath).replace(/^\/+/, '');
    
    // Check for directory traversal attempts
    if (cleanPath.includes('..') || cleanPath.includes('\\')) {
      return { isValid: false, error: 'Invalid path: directory traversal not allowed' };
    }

    // Construct the full path
    const fullPath = path.join(STORAGE_BASE, cleanPath);
    
    // Ensure the resolved path is within the storage directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorageBase = path.resolve(STORAGE_BASE);
    
    if (!resolvedPath.startsWith(resolvedStorageBase)) {
      return { isValid: false, error: 'Invalid path: access outside storage directory not allowed' };
    }

    return { isValid: true, safePath: resolvedPath };
  } catch (error) {
    return { isValid: false, error: 'Invalid path format' };
  }
}

// Get MIME type based on file extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Join the path segments
    const requestedPath = params.path.join('/');
    
    // Validate the file path
    const validation = validateFilePath(requestedPath);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 403 }
      );
    }

    // Check if file exists
    const filePath = validation.safePath!;
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return NextResponse.json(
          { error: 'Path is not a file' },
          { status: 404 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    // Set appropriate headers
    const headers: HeadersInit = {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      'Content-Length': fileBuffer.length.toString(),
    };

    // For images, add additional headers
    if (mimeType.startsWith('image/')) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // For downloads (PDFs, CSVs), add appropriate headers
    if (mimeType === 'application/pdf' || mimeType === 'text/csv') {
      const fileName = path.basename(filePath);
      headers['Content-Disposition'] = `inline; filename="${fileName}"`;
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// HEAD method for checking file existence
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const requestedPath = params.path.join('/');
    const validation = validateFilePath(requestedPath);
    
    if (!validation.isValid) {
      return new NextResponse(null, { status: 403 });
    }

    const filePath = validation.safePath!;
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return new NextResponse(null, { status: 404 });
      }
      
      const mimeType = getMimeType(filePath);
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': stats.size.toString(),
        },
      });
    } catch (error) {
      return new NextResponse(null, { status: 404 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}