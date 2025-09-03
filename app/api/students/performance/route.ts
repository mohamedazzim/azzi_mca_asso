import { NextRequest, NextResponse } from 'next/server';
import { StudentStorage } from '@/lib/local-storage';
import { saveStudentMetadata, getStudentMetadata } from '@/lib/storage';

// GET - Get performance data for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student details
    const students = await StudentStorage.getAllStudents();
    const student = students.find(s => s.id === studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get performance data from new storage if available
    const performanceData = {
      studentId,
      studentName: student.name,
      rollNumber: student.rollNumber,
      batch: student.batchYear || student.batch,
      achievements: student.achievements || [],
      scores: student.scores || [],
      attendedEvents: student.attendedEvents || [],
      awards: student.awards || [],
      performanceScore: calculatePerformanceScore(student),
      attendancePercentage: calculateAttendancePercentage(student),
      lastUpdated: student.updatedAt || student.createdAt
    };

    return NextResponse.json({
      success: true,
      performance: performanceData
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

// POST - Add performance record (achievement, score, award)
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { studentId, type, data } = await request.json();

    if (!studentId || !type || !data) {
      return NextResponse.json(
        { error: 'Student ID, type, and data are required' },
        { status: 400 }
      );
    }

    // Get current student data
    const students = await StudentStorage.getAllStudents();
    const student = students.find(s => s.id === studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Create new performance entry
    const performanceEntry = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      ...data,
      createdAt: new Date().toISOString()
    };

    // Update student record based on type
    let updatedStudent = { ...student };

    switch (type) {
      case 'achievement':
        updatedStudent.achievements = [...(student.achievements || []), performanceEntry];
        break;
      case 'score':
        updatedStudent.scores = [...(student.scores || []), performanceEntry];
        break;
      case 'award':
        updatedStudent.awards = [...(student.awards || []), performanceEntry];
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid performance type' },
          { status: 400 }
        );
    }

    updatedStudent.updatedAt = new Date().toISOString();

    // Update in storage
    await StudentStorage.updateStudent(studentId, updatedStudent);

    return NextResponse.json({
      success: true,
      message: `${type} added successfully`,
      entry: performanceEntry
    });

  } catch (error) {
    console.error('Error adding performance record:', error);
    return NextResponse.json(
      { error: 'Failed to add performance record' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculatePerformanceScore(student: any): number {
  const achievements = student.achievements || [];
  const scores = student.scores || [];
  
  let baseScore = 75; // Default base score
  
  // Add points for achievements
  achievements.forEach((achievement: any) => {
    if (achievement.type === 'first') baseScore += 10;
    else if (achievement.type === 'second') baseScore += 8;
    else if (achievement.type === 'third') baseScore += 5;
    else baseScore += 3;
  });
  
  // Average scores if available
  if (scores.length > 0) {
    const avgScore = scores.reduce((sum: number, score: any) => sum + (score.value || 0), 0) / scores.length;
    baseScore = Math.round((baseScore + avgScore) / 2);
  }
  
  return Math.min(100, Math.max(0, baseScore));
}

function calculateAttendancePercentage(student: any): number {
  const attendedEvents = student.attendedEvents || [];
  const totalEvents = student.totalEvents || 10;
  return totalEvents > 0 ? Math.round((attendedEvents.length / totalEvents) * 100) : 0;
}