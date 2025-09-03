import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics-engine';

// GET - Advanced analytics with date filtering and detailed insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'comprehensive'; // comprehensive, students, events, performance
    const granularity = searchParams.get('granularity') || 'monthly'; // daily, weekly, monthly
    const format = searchParams.get('format') || 'json'; // json, csv

    // Build date range
    const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

    // Generate analytics based on type
    let analytics;
    switch (type) {
      case 'comprehensive':
        analytics = await analyticsEngine.generateAnalytics(dateRange);
        break;
      case 'students':
        const fullAnalytics = await analyticsEngine.generateAnalytics(dateRange);
        analytics = { students: fullAnalytics.students, overview: fullAnalytics.overview };
        break;
      case 'events':
        const eventAnalytics = await analyticsEngine.generateAnalytics(dateRange);
        analytics = { events: eventAnalytics.events, overview: eventAnalytics.overview };
        break;
      case 'performance':
        const perfAnalytics = await analyticsEngine.generateAnalytics(dateRange);
        analytics = { performance: perfAnalytics.performance, overview: perfAnalytics.overview };
        break;
      default:
        analytics = await analyticsEngine.generateAnalytics(dateRange);
    }

    // Format response
    if (format === 'csv') {
      const csv = generateAnalyticsCSV(analytics);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="analytics.csv"'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      filters: {
        startDate,
        endDate,
        type,
        granularity
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

// POST - Generate custom analytics report
export async function POST(request: NextRequest) {
  try {
    const {
      dateRange,
      filters,
      metrics,
      groupBy,
      exportFormat
    } = await request.json();

    // Custom analytics generation based on filters
    const analytics = await analyticsEngine.generateAnalytics(dateRange);

    // Apply custom filtering and grouping
    let customData = analytics;
    
    if (filters) {
      // Apply custom filters (implementation would depend on specific requirements)
      if (filters.batches) {
        // Filter by specific batches
      }
      if (filters.eventTypes) {
        // Filter by specific event types
      }
    }

    if (groupBy) {
      // Group data by specified criteria
      switch (groupBy) {
        case 'batch':
          customData = {
            ...customData,
            groupedData: analytics.students.studentsByBatch
          };
          break;
        case 'section':
          customData = {
            ...customData,
            groupedData: analytics.students.studentsBySection
          };
          break;
        case 'eventType':
          customData = {
            ...customData,
            groupedData: analytics.events.eventsByType
          };
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: customData,
      requestParams: {
        dateRange,
        filters,
        metrics,
        groupBy
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to generate custom analytics' },
      { status: 500 }
    );
  }
}

function generateAnalyticsCSV(analytics: any): string {
  const rows = [];
  
  // Header
  rows.push(['Metric', 'Value', 'Category']);
  
  // Overview data
  if (analytics.overview) {
    rows.push(['Total Students', analytics.overview.totalStudents, 'Overview']);
    rows.push(['Total Events', analytics.overview.totalEvents, 'Overview']);
    rows.push(['Total Achievements', analytics.overview.totalAchievements, 'Overview']);
    rows.push(['Active Students', analytics.overview.activeStudents, 'Overview']);
  }
  
  // Student analytics
  if (analytics.students) {
    rows.push(['New Students This Month', analytics.students.newStudentsThisMonth, 'Students']);
    rows.push(['Average Age', analytics.students.averageAge, 'Students']);
    
    // Batch distribution
    Object.entries(analytics.students.studentsByBatch || {}).forEach(([batch, count]) => {
      rows.push([`Students in ${batch}`, count, 'Student Distribution']);
    });
  }
  
  // Event analytics
  if (analytics.events) {
    rows.push(['Events This Month', analytics.events.eventsThisMonth, 'Events']);
    rows.push(['Average Participants', analytics.events.averageParticipants, 'Events']);
    
    // Event type distribution
    Object.entries(analytics.events.eventsByType || {}).forEach(([type, count]) => {
      rows.push([`${type} Events`, count, 'Event Types']);
    });
  }
  
  // Performance analytics
  if (analytics.performance) {
    rows.push(['Average Performance Score', analytics.performance.averagePerformanceScore, 'Performance']);
    
    // Performance distribution
    Object.entries(analytics.performance.performanceDistribution || {}).forEach(([range, count]) => {
      rows.push([`Performance ${range}`, count, 'Performance Distribution']);
    });
  }
  
  // Convert to CSV string
  return rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}