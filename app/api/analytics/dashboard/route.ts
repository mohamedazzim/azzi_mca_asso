import { NextRequest, NextResponse } from 'next/server';
import { StudentStorage, EventStorage } from '@/lib/local-storage';

export async function GET(request: NextRequest) {
  try {
    // Fetch analytics data
    const [students, events] = await Promise.all([
      StudentStorage.getAllStudents(),
      EventStorage.getAllEvents()
    ]);

    // Calculate analytics metrics
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.isActive !== false).length;
    const totalEvents = events.length;
    
    // Event statistics by status
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
    const ongoingEvents = events.filter(e => e.status === 'ongoing').length;
    
    // Student statistics by batch
    const batchStats = students.reduce((acc: any, student) => {
      const batch = student.batchYear?.toString() || student.batch || 'Unknown';
      acc[batch] = (acc[batch] || 0) + 1;
      return acc;
    }, {});

    // Gender distribution
    const genderStats = students.reduce((acc: any, student) => {
      const gender = student.gender || 'Not Specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Events by type
    const eventTypeStats = events.reduce((acc: any, event) => {
      const type = event.eventType || 'General';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Monthly event trends (last 12 months)
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toISOString().substring(0, 7); // YYYY-MM format
      
      const monthEvents = events.filter(event => {
        if (!event.eventDate) return false;
        const eventMonth = new Date(event.eventDate).toISOString().substring(0, 7);
        return eventMonth === monthStr;
      });
      
      monthlyTrends.push({
        month: monthStr,
        events: monthEvents.length,
        totalParticipants: monthEvents.reduce((sum, event) => 
          sum + (event.attendees?.length || 0), 0
        )
      });
    }

    // Performance metrics
    const studentsWithAchievements = students.filter(s => 
      s.achievements && s.achievements.length > 0
    ).length;

    // Financial metrics
    const totalFundsSpent = events.reduce((total, event) => 
      total + (event.fundSpent || 0), 0
    );

    // Recent activity
    const recentEvents = events
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(event => ({
        id: event.id,
        title: event.title,
        date: event.eventDate,
        status: event.status,
        participants: event.attendees?.length || 0
      }));

    const recentStudents = students
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        batch: student.batchYear || student.batch,
        joinDate: student.createdAt
      }));

    const analytics = {
      overview: {
        totalStudents,
        activeStudents,
        totalEvents,
        completedEvents,
        upcomingEvents,
        ongoingEvents,
        studentsWithAchievements,
        totalFundsSpent
      },
      distributions: {
        batchStats,
        genderStats,
        eventTypeStats
      },
      trends: {
        monthlyEvents: monthlyTrends
      },
      recentActivity: {
        events: recentEvents,
        students: recentStudents
      },
      performance: {
        averageEventParticipation: totalEvents > 0 ? 
          events.reduce((sum, e) => sum + (e.attendees?.length || 0), 0) / totalEvents : 0,
        studentEngagementRate: totalStudents > 0 ? 
          (studentsWithAchievements / totalStudents) * 100 : 0,
        averageEventBudget: totalEvents > 0 ? totalFundsSpent / totalEvents : 0
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataVersion: '2.0.0'
      }
    };

    return NextResponse.json(analytics, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' // 5 minutes cache
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to generate analytics',
        message: 'Unable to fetch analytics data. Please try again later.'
      },
      { status: 500 }
    );
  }
}