import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup-restore';
import { auditLogger } from '@/lib/audit-logger';

// GET - List all backups
export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const backups = await backupManager.listBackups();
    
    return NextResponse.json({
      success: true,
      backups
    });

  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

// POST - Create new backup
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { description, includes } = await request.json();
    const username = request.headers.get("x-user-name") || "admin";
    const userId = request.headers.get("x-user-id") || "admin";

    if (!description) {
      return NextResponse.json(
        { error: 'Backup description is required' },
        { status: 400 }
      );
    }

    // Create backup with specified options
    const backupIncludes = {
      students: includes?.students !== false,
      events: includes?.events !== false,
      users: includes?.users !== false,
      logs: includes?.logs || false,
      media: includes?.media !== false
    };

    const backupId = await backupManager.createBackup(
      description,
      username,
      backupIncludes
    );

    // Log the backup creation
    await auditLogger.log(
      userId,
      username,
      'backup_created',
      'system',
      {
        resourceId: backupId,
        details: { description, includes: backupIncludes }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backupId
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete backup
export async function DELETE(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('id');
    const username = request.headers.get("x-user-name") || "admin";
    const userId = request.headers.get("x-user-id") || "admin";

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    const deleted = await backupManager.deleteBackup(backupId);

    if (deleted) {
      // Log the backup deletion
      await auditLogger.log(
        userId,
        username,
        'backup_deleted',
        'system',
        {
          resourceId: backupId
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}