import { NextRequest, NextResponse } from 'next/server';
import { saveEventMetadata, getEventMetadata } from '@/lib/storage';
import { EventStorage } from '@/lib/local-storage';

// GET winners for an event
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

    // Get winners data from new storage if it exists
    const eventYear = new Date(event.eventDate).getFullYear().toString();
    const eventMonth = String(new Date(event.eventDate).getMonth() + 1).padStart(2, '0') + '-' + new Date(event.eventDate).toLocaleString('default', { month: 'long' });
    
    const metadataResult = await getEventMetadata(eventYear, eventMonth, eventId);
    let winnersData = [];
    
    if (metadataResult.success && metadataResult.data.winners) {
      winnersData = metadataResult.data.winners;
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventTitle: event.title,
      eventDate: event.eventDate,
      isCompetition: event.isCompetition || false,
      winners: winnersData,
      totalWinners: winnersData.length
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch winners data' },
      { status: 500 }
    );
  }
}

// POST to add a winner
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
    const winnerData = await request.json();

    // Validate required fields
    if (!winnerData.studentId || !winnerData.awardTitle) {
      return NextResponse.json(
        { error: 'Student ID and award title are required' },
        { status: 400 }
      );
    }

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

    // Get current metadata
    const currentMetadata = await getEventMetadata(eventYear, eventMonth, eventId);
    const existingData = currentMetadata.success ? currentMetadata.data : event;
    const existingWinners = existingData.winners || [];

    // Create new winner entry
    const newWinner = {
      id: `winner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId: winnerData.studentId,
      studentName: winnerData.studentName || '',
      awardTitle: winnerData.awardTitle,
      position: winnerData.position || null,
      category: winnerData.category || '',
      prizeAmount: winnerData.prizeAmount || 0,
      certificateUrl: winnerData.certificateUrl || '',
      resultDescription: winnerData.resultDescription || '',
      createdAt: new Date().toISOString()
    };

    // Add to winners list
    const updatedWinners = [...existingWinners, newWinner];

    // Update metadata
    const updatedMetadata = {
      ...existingData,
      winners: updatedWinners,
      isCompetition: true, // Mark as competition if it has winners
      updatedAt: new Date().toISOString()
    };
    
    await saveEventMetadata(eventYear, eventMonth, eventId, updatedMetadata);

    return NextResponse.json({
      success: true,
      message: 'Winner added successfully',
      winner: newWinner,
      totalWinners: updatedWinners.length
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to add winner' },
      { status: 500 }
    );
  }
}

// DELETE to remove a winner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const eventId = params.id;
    const { searchParams } = new URL(request.url);
    const winnerId = searchParams.get('winnerId');

    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required' },
        { status: 400 }
      );
    }

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

    // Get current metadata
    const currentMetadata = await getEventMetadata(eventYear, eventMonth, eventId);
    const existingData = currentMetadata.success ? currentMetadata.data : event;
    const existingWinners = existingData.winners || [];

    // Remove winner
    const updatedWinners = existingWinners.filter(winner => winner.id !== winnerId);

    if (updatedWinners.length === existingWinners.length) {
      return NextResponse.json(
        { error: 'Winner not found' },
        { status: 404 }
      );
    }

    // Update metadata
    const updatedMetadata = {
      ...existingData,
      winners: updatedWinners,
      updatedAt: new Date().toISOString()
    };
    
    await saveEventMetadata(eventYear, eventMonth, eventId, updatedMetadata);

    return NextResponse.json({
      success: true,
      message: 'Winner removed successfully',
      totalWinners: updatedWinners.length
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to remove winner' },
      { status: 500 }
    );
  }
}