import { NextRequest, NextResponse } from 'next/server';
import { StudentStorage } from '@/lib/local-storage';
import { saveStudentProfilePhoto, deleteFolder } from '@/lib/storage';

// POST - Handle bulk operations (delete, edit, photo upload)
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { operation, studentIds, updateData } = await request.json();

    if (!operation || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Operation type and student IDs are required' },
        { status: 400 }
      );
    }

    switch (operation) {
      case 'bulk_delete':
        return await handleBulkDelete(studentIds);
      
      case 'bulk_edit':
        return await handleBulkEdit(studentIds, updateData);
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

// Bulk delete students
async function handleBulkDelete(studentIds: string[]) {
  const results = {
    deleted: 0,
    failed: [] as string[],
    errors: [] as string[]
  };

  for (const studentId of studentIds) {
    try {
      // Get student details first
      const students = await StudentStorage.getAllStudents();
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        results.failed.push(studentId);
        results.errors.push(`Student ${studentId} not found`);
        continue;
      }

      // Delete student files if they exist
      if (student.batchYear && student.rollNumber) {
        const studentPath = `./storage/students/${student.batchYear}/${student.rollNumber}`;
        await deleteFolder(studentPath);
      }

      // Delete from storage
      await StudentStorage.deleteStudent(studentId);
      results.deleted++;

    } catch (error) {
      results.failed.push(studentId);
      results.errors.push(`Failed to delete ${studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk delete completed. ${results.deleted} students deleted.`,
    results
  });
}

// Bulk edit students  
async function handleBulkEdit(studentIds: string[], updateData: any) {
  const results = {
    updated: 0,
    failed: [] as string[],
    errors: [] as string[]
  };

  if (!updateData) {
    return NextResponse.json(
      { error: 'Update data is required for bulk edit' },
      { status: 400 }
    );
  }

  for (const studentId of studentIds) {
    try {
      // Get current student data
      const students = await StudentStorage.getAllStudents();
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        results.failed.push(studentId);
        results.errors.push(`Student ${studentId} not found`);
        continue;
      }

      // Merge update data with existing data
      const updatedStudent = {
        ...student,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Update in storage
      await StudentStorage.updateStudent(studentId, updatedStudent);
      results.updated++;

    } catch (error) {
      results.failed.push(studentId);
      results.errors.push(`Failed to update ${studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk edit completed. ${results.updated} students updated.`,
    results
  });
}

// PUT - Handle bulk photo upload from ZIP
export async function PUT(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const zipFile = formData.get('photoZip') as File;
    const batchYear = formData.get('batchYear') as string;

    if (!zipFile || !batchYear) {
      return NextResponse.json(
        { error: 'ZIP file and batch year are required' },
        { status: 400 }
      );
    }

    // For now, return a placeholder response
    // TODO: Implement ZIP extraction and photo processing
    return NextResponse.json({
      success: true,
      message: 'Bulk photo upload feature will be implemented in a future update',
      processed: 0,
      uploaded: 0,
      failed: []
    });

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to process bulk photo upload' },
      { status: 500 }
    );
  }
}