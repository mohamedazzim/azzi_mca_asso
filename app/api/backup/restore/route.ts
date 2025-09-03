import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup-restore';
import { auditLogger } from '@/lib/audit-logger';

// POST - Restore from backup
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { backupId, options } = await request.json();
    const username = request.headers.get("x-user-name") || "admin";
    const userId = request.headers.get("x-user-id") || "admin";

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    // Perform restore
    const restoreResult = await backupManager.restoreBackup(backupId, options);

    // Log the restore operation
    await auditLogger.log(
      userId,
      username,
      'backup_restored',
      'system',
      {
        resourceId: backupId,
        details: {
          success: restoreResult.success,
          restored: restoreResult.restored,
          options
        },
        success: restoreResult.success,
        error: restoreResult.errors.join(', ') || undefined
      }
    );

    if (restoreResult.success) {
      return NextResponse.json({
        success: true,
        message: restoreResult.message,
        restored: restoreResult.restored
      });
    } else {
      return NextResponse.json(
        { 
          error: restoreResult.message,
          details: restoreResult.errors
        },
        { status: 400 }
      );
    }

  } catch (error) {
    
    return NextResponse.json(
      { error: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}