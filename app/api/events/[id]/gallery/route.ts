import { NextRequest, NextResponse } from 'next/server';
import { listFiles, getEventMetadata } from '@/lib/storage';
import path from 'path';

const STORAGE_BASE = process.env.STORAGE_BASE_PATH || './storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get event metadata to determine the year and month
    const allEventDirs = await getAllEventDirectories();
    let eventMetadata = null;
    let eventYear = '';
    let eventMonth = '';

    // Find the event by searching through directories
    for (const dir of allEventDirs) {
      const { year, month } = dir;
      const metadataResult = await getEventMetadata(year, month, eventId);
      if (metadataResult.success) {
        eventMetadata = metadataResult.data;
        eventYear = year;
        eventMonth = month;
        break;
      }
    }

    if (!eventMetadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get files from different categories
    const baseEventPath = path.join(STORAGE_BASE, 'events', eventYear, eventMonth, eventId);
    
    const gallery = {
      photos: [],
      reports: [],
      attendance: [],
      metadata: eventMetadata
    };

    // Get photos
    const photosPath = path.join(baseEventPath, 'photos');
    const photosResult = await listFiles(photosPath);
    if (photosResult.success && photosResult.files) {
      gallery.photos = photosResult.files
        .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/api/storage/events/${eventYear}/${eventMonth}/${eventId}/photos/${file}`,
          type: 'image',
          category: 'photo'
        }));
    }

    // Get reports
    const reportsPath = path.join(baseEventPath, 'reports');
    const reportsResult = await listFiles(reportsPath);
    if (reportsResult.success && reportsResult.files) {
      gallery.reports = reportsResult.files
        .filter(file => /\.(pdf|doc|docx)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/api/storage/events/${eventYear}/${eventMonth}/${eventId}/reports/${file}`,
          type: 'document',
          category: 'report'
        }));
    }

    // Get attendance files
    const attendancePath = path.join(baseEventPath, 'attendance');
    const attendanceResult = await listFiles(attendancePath);
    if (attendanceResult.success && attendanceResult.files) {
      gallery.attendance = attendanceResult.files
        .map(file => ({
          name: file,
          url: `/api/storage/events/${eventYear}/${eventMonth}/${eventId}/attendance/${file}`,
          type: /\.(pdf)$/i.test(file) ? 'document' : 'data',
          category: 'attendance'
        }));
    }

    // Calculate totals
    const totals = {
      photos: gallery.photos.length,
      reports: gallery.reports.length,
      attendance: gallery.attendance.length,
      total: gallery.photos.length + gallery.reports.length + gallery.attendance.length
    };

    return NextResponse.json({
      success: true,
      eventId,
      eventTitle: eventMetadata.title,
      eventDate: eventMetadata.eventDate,
      gallery,
      totals
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch event gallery' },
      { status: 500 }
    );
  }
}

// Helper function to get all event directories
async function getAllEventDirectories() {
  const eventsPath = path.join(STORAGE_BASE, 'events');
  const directories = [];
  
  try {
    const { listFiles } = await import('@/lib/storage');
    const yearsResult = await listFiles(eventsPath);
    
    if (yearsResult.success && yearsResult.files) {
      for (const year of yearsResult.files) {
        const yearPath = path.join(eventsPath, year);
        const monthsResult = await listFiles(yearPath);
        
        if (monthsResult.success && monthsResult.files) {
          for (const month of monthsResult.files) {
            directories.push({ year, month });
          }
        }
      }
    }
  } catch (error) {
    
  }
  
  return directories;
}

// POST method to upload additional files to event gallery
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const eventId = params.id;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const category = formData.get('category') as string; // 'photos', 'reports', 'attendance'
    
    if (!file || !category) {
      return NextResponse.json(
        { error: 'File and category are required' },
        { status: 400 }
      );
    }

    // Find event to get year and month
    const allEventDirs = await getAllEventDirectories();
    let eventYear = '';
    let eventMonth = '';

    for (const dir of allEventDirs) {
      const { year, month } = dir;
      const metadataResult = await getEventMetadata(year, month, eventId);
      if (metadataResult.success) {
        eventYear = year;
        eventMonth = month;
        break;
      }
    }

    if (!eventYear || !eventMonth) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Save the file
    const { saveEventFile } = await import('@/lib/storage');
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveEventFile(
      eventYear,
      eventMonth,
      eventId,
      buffer,
      file.type,
      file.name,
      category as 'photos' | 'reports' | 'attendance'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        fileUrl: result.fileUrl,
        fileName: file.name,
        category
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 400 }
      );
    }

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}