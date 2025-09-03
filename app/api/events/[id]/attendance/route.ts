import { NextRequest, NextResponse } from 'next/server';
import { saveEventMetadata, getEventMetadata, saveEventFile } from '@/lib/storage';
import { EventStorage } from '@/lib/local-storage';
import path from 'path';

// GET attendance data for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Get event from existing storage first
    const events = await EventStorage.getAllEvents();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get attendance data from new storage if it exists
    const eventYear = new Date(event.eventDate).getFullYear().toString();
    const eventMonth = String(new Date(event.eventDate).getMonth() + 1).padStart(2, '0') + '-' + new Date(event.eventDate).toLocaleString('default', { month: 'long' });
    
    const metadataResult = await getEventMetadata(eventYear, eventMonth, eventId);
    let attendanceData = event.participants || [];
    
    if (metadataResult.success && metadataResult.data.attendance) {
      attendanceData = metadataResult.data.attendance;
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventTitle: event.title,
      eventDate: event.eventDate,
      attendance: attendanceData,
      totalParticipants: attendanceData.length
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}

// POST to mark attendance or upload attendance sheet
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
    const contentType = request.headers.get("content-type") || "";

    // Get event details
    const events = await EventStorage.getAllEvents();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventYear = new Date(event.eventDate).getFullYear().toString();
    const eventMonth = String(new Date(event.eventDate).getMonth() + 1).padStart(2, '0') + '-' + new Date(event.eventDate).toLocaleString('default', { month: 'long' });

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload (attendance sheet)
      const formData = await request.formData();
      const file = formData.get('attendanceSheet') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'Attendance sheet file is required' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await saveEventFile(
        eventYear,
        eventMonth,
        eventId,
        buffer,
        file.type,
        file.name,
        'attendance'
      );

      if (result.success) {
        // Update event metadata with attendance sheet path
        const currentMetadata = await getEventMetadata(eventYear, eventMonth, eventId);
        const updatedMetadata = {
          ...(currentMetadata.success ? currentMetadata.data : event),
          attendanceSheetUrl: result.fileUrl,
          updatedAt: new Date().toISOString()
        };
        
        await saveEventMetadata(eventYear, eventMonth, eventId, updatedMetadata);

        return NextResponse.json({
          success: true,
          message: 'Attendance sheet uploaded successfully',
          fileUrl: result.fileUrl
        });
      } else {
        return NextResponse.json(
          { error: result.error || 'Upload failed' },
          { status: 400 }
        );
      }

    } else {
      // Handle attendance marking (JSON data)
      const attendanceData = await request.json();
      
      if (!attendanceData.studentIds || !Array.isArray(attendanceData.studentIds)) {
        return NextResponse.json(
          { error: 'Student IDs array is required' },
          { status: 400 }
        );
      }

      // Get current metadata or use event data
      const currentMetadata = await getEventMetadata(eventYear, eventMonth, eventId);
      const existingAttendance = currentMetadata.success && currentMetadata.data.attendance ? currentMetadata.data.attendance : [];
      
      // Process attendance marking
      const attendanceList = attendanceData.studentIds.map(studentId => ({
        studentId,
        status: 'present',
        markedAt: new Date().toISOString(),
        markedBy: attendanceData.markedBy || 'admin'
      }));

      const updatedMetadata = {
        ...(currentMetadata.success ? currentMetadata.data : event),
        attendance: [...existingAttendance, ...attendanceList],
        attendanceMarkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveEventMetadata(eventYear, eventMonth, eventId, updatedMetadata);

      return NextResponse.json({
        success: true,
        message: 'Attendance marked successfully',
        totalMarked: attendanceList.length,
        totalAttendance: updatedMetadata.attendance.length
      });
    }

  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance' },
      { status: 500 }
    );
  }
}