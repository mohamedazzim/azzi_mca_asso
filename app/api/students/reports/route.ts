import { NextRequest, NextResponse } from 'next/server';
import { StudentStorage } from '@/lib/local-storage';

// GET - Generate and download student reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type'); // 'list', 'profile', 'performance'
    const format = searchParams.get('format') || 'json'; // 'json', 'csv', 'pdf'
    const studentId = searchParams.get('studentId');
    const batchFilter = searchParams.get('batch');
    const sectionFilter = searchParams.get('section');

    switch (reportType) {
      case 'list':
        return await generateStudentList(format, { batch: batchFilter, section: sectionFilter });
      
      case 'profile':
        if (!studentId) {
          return NextResponse.json(
            { error: 'Student ID is required for profile report' },
            { status: 400 }
          );
        }
        return await generateStudentProfile(studentId, format);
      
      case 'performance':
        return await generatePerformanceReport(format, { batch: batchFilter, section: sectionFilter });
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: list, profile, or performance' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Generate student list report
async function generateStudentList(format: string, filters: any) {
  const students = await StudentStorage.getAllStudents(filters);
  
  const studentList = students.map(student => ({
    rollNumber: student.rollNumber,
    name: student.name,
    email: student.email,
    phone: student.phone,
    batch: student.batchYear || student.batch,
    section: student.section,
    gender: student.gender,
    bloodGroup: student.bloodGroup,
    hostellerStatus: student.hostellerStatus,
    isActive: student.isActive !== false
  }));

  if (format === 'csv') {
    const csv = generateCSV(studentList);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="student-list.csv"'
      }
    });
  } else if (format === 'pdf') {
    const pdf = await generatePDF('Student List', studentList);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="student-list.pdf"'
      }
    });
  } else {
    return NextResponse.json({
      success: true,
      reportType: 'Student List',
      totalStudents: studentList.length,
      data: studentList,
      generatedAt: new Date().toISOString()
    });
  }
}

// Generate individual student profile report
async function generateStudentProfile(studentId: string, format: string) {
  const students = await StudentStorage.getAllStudents();
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return NextResponse.json(
      { error: 'Student not found' },
      { status: 404 }
    );
  }

  const profile = {
    ...student,
    achievements: student.achievements || [],
    scores: student.scores || [],
    attendedEvents: student.attendedEvents || [],
    awards: student.awards || [],
    performanceScore: calculatePerformanceScore(student),
    attendancePercentage: calculateAttendancePercentage(student)
  };

  if (format === 'pdf') {
    const pdf = await generateProfilePDF(profile);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="profile-${student.rollNumber}.pdf"`
      }
    });
  } else {
    return NextResponse.json({
      success: true,
      reportType: 'Student Profile',
      profile,
      generatedAt: new Date().toISOString()
    });
  }
}

// Generate performance report for all students
async function generatePerformanceReport(format: string, filters: any) {
  const students = await StudentStorage.getAllStudents(filters);
  
  const performanceData = students.map(student => ({
    rollNumber: student.rollNumber,
    name: student.name,
    batch: student.batchYear || student.batch,
    section: student.section,
    achievementsCount: (student.achievements || []).length,
    scoresCount: (student.scores || []).length,
    attendedEventsCount: (student.attendedEvents || []).length,
    awardsCount: (student.awards || []).length,
    performanceScore: calculatePerformanceScore(student),
    attendancePercentage: calculateAttendancePercentage(student)
  }));

  if (format === 'csv') {
    const csv = generateCSV(performanceData);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="performance-report.csv"'
      }
    });
  } else if (format === 'pdf') {
    const pdf = await generatePDF('Performance Report', performanceData);
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="performance-report.pdf"'
      }
    });
  } else {
    return NextResponse.json({
      success: true,
      reportType: 'Performance Report',
      totalStudents: performanceData.length,
      data: performanceData,
      generatedAt: new Date().toISOString()
    });
  }
}

// Helper function to generate CSV
function generateCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(header => `"${header}"`).join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return `"${(value || '').toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\\n');
}

// Helper function to generate PDF (simplified implementation)
async function generatePDF(title: string, data: any[]): Promise<Buffer> {
  // This is a simplified PDF generation
  // In a real implementation, you would use a library like jsPDF or Puppeteer
  
  const pdfContent = `
    %PDF-1.4
    1 0 obj
    <<
    /Type /Catalog
    /Pages 2 0 R
    >>
    endobj
    
    2 0 obj
    <<
    /Type /Pages
    /Kids [3 0 R]
    /Count 1
    >>
    endobj
    
    3 0 obj
    <<
    /Type /Page
    /Parent 2 0 R
    /MediaBox [0 0 612 792]
    /Contents 4 0 R
    >>
    endobj
    
    4 0 obj
    <<
    /Length 44
    >>
    stream
    BT
    /F1 12 Tf
    100 700 Td
    (${title} - ${data.length} records) Tj
    ET
    endstream
    endobj
    
    xref
    0 5
    0000000000 65535 f 
    0000000009 00000 n 
    0000000074 00000 n 
    0000000120 00000 n 
    0000000179 00000 n 
    trailer
    <<
    /Size 5
    /Root 1 0 R
    >>
    startxref
    238
    %%EOF
  `;
  
  return Buffer.from(pdfContent, 'utf-8');
}

// Helper function to generate profile PDF
async function generateProfilePDF(profile: any): Promise<Buffer> {
  const pdfContent = `
    %PDF-1.4
    1 0 obj
    <<
    /Type /Catalog
    /Pages 2 0 R
    >>
    endobj
    
    2 0 obj
    <<
    /Type /Pages
    /Kids [3 0 R]
    /Count 1
    >>
    endobj
    
    3 0 obj
    <<
    /Type /Page
    /Parent 2 0 R
    /MediaBox [0 0 612 792]
    /Contents 4 0 R
    >>
    endobj
    
    4 0 obj
    <<
    /Length 80
    >>
    stream
    BT
    /F1 12 Tf
    100 700 Td
    (Student Profile: ${profile.name}) Tj
    0 -20 Td
    (Roll Number: ${profile.rollNumber}) Tj
    ET
    endstream
    endobj
    
    xref
    0 5
    0000000000 65535 f 
    0000000009 00000 n 
    0000000074 00000 n 
    0000000120 00000 n 
    0000000179 00000 n 
    trailer
    <<
    /Size 5
    /Root 1 0 R
    >>
    startxref
    284
    %%EOF
  `;
  
  return Buffer.from(pdfContent, 'utf-8');
}

// Helper functions (reused from other files)
function calculatePerformanceScore(student: any): number {
  const achievements = student.achievements || [];
  const scores = student.scores || [];
  
  let baseScore = 75;
  
  achievements.forEach((achievement: any) => {
    if (achievement.type === 'first') baseScore += 10;
    else if (achievement.type === 'second') baseScore += 8;
    else if (achievement.type === 'third') baseScore += 5;
    else baseScore += 3;
  });
  
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