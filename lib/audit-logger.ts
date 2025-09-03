// Audit logging system for tracking user actions and security events
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type AuditAction = 
  // Authentication actions
  | 'login' | 'logout' | 'login_failed' | 'password_changed' | 'account_locked'
  // Student management
  | 'student_created' | 'student_updated' | 'student_deleted' | 'student_viewed'
  | 'student_photo_uploaded' | 'student_bulk_deleted' | 'student_bulk_updated'
  // Event management  
  | 'event_created' | 'event_updated' | 'event_deleted' | 'event_viewed'
  | 'event_attendance_added' | 'event_winner_added' | 'event_gallery_updated'
  // File operations
  | 'file_uploaded' | 'file_deleted' | 'pdf_imported' | 'data_exported'
  // System operations
  | 'backup_created' | 'backup_restored' | 'system_settings_changed'
  // Security events
  | 'unauthorized_access' | 'permission_denied' | 'suspicious_activity';

const AUDIT_LOG_PATH = './storage/logs';
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const LOG_RETENTION_DAYS = 90;

export class AuditLogger {
  private static instance: AuditLogger;
  private logBuffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.ensureLogDirectory();
    this.startAutoFlush();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      if (!existsSync(AUDIT_LOG_PATH)) {
        await mkdir(AUDIT_LOG_PATH, { recursive: true });
      }
    } catch (error) {
      
    }
  }

  private startAutoFlush(): void {
    // Flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 30000);
  }

  public async log(
    userId: string,
    username: string,
    action: AuditAction,
    resource: string,
    options: {
      resourceId?: string;
      details?: any;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      error?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    } = {}
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      userId,
      username,
      action,
      resource,
      resourceId: options.resourceId,
      details: options.details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success ?? true,
      error: options.error,
      severity: options.severity ?? this.determineSeverity(action, options.success ?? true)
    };

    this.logBuffer.push(entry);

    // Flush immediately for critical events
    if (entry.severity === 'critical') {
      await this.flushLogs();
    }

    // Also log to console for immediate visibility
    this.logToConsole(entry);
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(action: AuditAction, success: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (!success) {
      // Failed actions are generally more severe
      if (['login_failed', 'unauthorized_access', 'permission_denied'].includes(action)) {
        return 'high';
      }
      return 'medium';
    }

    switch (action) {
      case 'login':
      case 'logout':
      case 'student_viewed':
      case 'event_viewed':
        return 'low';
      
      case 'student_created':
      case 'student_updated':
      case 'event_created':
      case 'event_updated':
      case 'file_uploaded':
        return 'medium';
      
      case 'student_deleted':
      case 'event_deleted':
      case 'student_bulk_deleted':
      case 'student_bulk_updated':
      case 'file_deleted':
      case 'password_changed':
        return 'high';
      
      case 'backup_created':
      case 'backup_restored':
      case 'system_settings_changed':
      case 'account_locked':
      case 'suspicious_activity':
        return 'critical';
      
      default:
        return 'medium';
    }
  }

  private logToConsole(entry: AuditLogEntry): void {
    const prefix = `[AUDIT ${entry.severity.toUpperCase()}]`;
    const message = `${prefix} ${entry.username} ${entry.action} ${entry.resource}${entry.resourceId ? ` (${entry.resourceId})` : ''}`;
    
    switch (entry.severity) {
      case 'critical':
        
        break;
      case 'high':
        
        break;
      default:
        
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const today = new Date().toISOString().split('T')[0];
      const logFileName = `audit-${today}.log`;
      const logFilePath = path.join(AUDIT_LOG_PATH, logFileName);

      const logLines = logsToFlush.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      await writeFile(logFilePath, logLines, { flag: 'a' });
      
      // Check if log rotation is needed
      await this.rotateLogsIfNeeded(logFilePath);
      
    } catch (error) {
      
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private async rotateLogsIfNeeded(filePath: string): Promise<void> {
    try {
      const stats = await this.getFileSize(filePath);
      if (stats && stats.size > MAX_LOG_FILE_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = filePath.replace('.log', `-${timestamp}.log`);
        
        // In a real implementation, you'd move the file
        // For now, we'll just create a new file
        
      }
    } catch (error) {
      
    }
  }

  private async getFileSize(filePath: string): Promise<{ size: number } | null> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(filePath);
      return { size: stats.size };
    } catch {
      return null;
    }
  }

  public async searchLogs(criteria: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    // This would implement log searching functionality
    // For now, return empty array
    return [];
  }

  public async getLogsSummary(days: number = 7): Promise<{
    totalEntries: number;
    byAction: Record<string, number>;
    bySeverity: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    // This would implement log summary functionality
    // For now, return empty summary
    return {
      totalEntries: 0,
      byAction: {},
      bySeverity: {},
      byUser: {}
    };
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushLogs(); // Final flush
  }
}

// Singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience functions for common audit events
export const logAuth = {
  login: (userId: string, username: string, ipAddress?: string) =>
    auditLogger.log(userId, username, 'login', 'authentication', { ipAddress }),
  
  loginFailed: (username: string, ipAddress?: string, error?: string) =>
    auditLogger.log('', username, 'login_failed', 'authentication', { 
      ipAddress, error, success: false 
    }),
  
  logout: (userId: string, username: string) =>
    auditLogger.log(userId, username, 'logout', 'authentication'),
  
  passwordChanged: (userId: string, username: string) =>
    auditLogger.log(userId, username, 'password_changed', 'authentication')
};

export const logStudent = {
  created: (userId: string, username: string, studentId: string) =>
    auditLogger.log(userId, username, 'student_created', 'student', { resourceId: studentId }),
  
  updated: (userId: string, username: string, studentId: string, details?: any) =>
    auditLogger.log(userId, username, 'student_updated', 'student', { resourceId: studentId, details }),
  
  deleted: (userId: string, username: string, studentId: string) =>
    auditLogger.log(userId, username, 'student_deleted', 'student', { resourceId: studentId }),
  
  bulkDeleted: (userId: string, username: string, count: number) =>
    auditLogger.log(userId, username, 'student_bulk_deleted', 'student', { details: { count } })
};

export const logEvent = {
  created: (userId: string, username: string, eventId: string) =>
    auditLogger.log(userId, username, 'event_created', 'event', { resourceId: eventId }),
  
  updated: (userId: string, username: string, eventId: string, details?: any) =>
    auditLogger.log(userId, username, 'event_updated', 'event', { resourceId: eventId, details }),
  
  deleted: (userId: string, username: string, eventId: string) =>
    auditLogger.log(userId, username, 'event_deleted', 'event', { resourceId: eventId })
};

export const logSecurity = {
  unauthorizedAccess: (username: string, resource: string, ipAddress?: string) =>
    auditLogger.log('', username, 'unauthorized_access', resource, { 
      ipAddress, success: false, severity: 'high' 
    }),
  
  permissionDenied: (userId: string, username: string, resource: string, ipAddress?: string) =>
    auditLogger.log(userId, username, 'permission_denied', resource, { 
      ipAddress, success: false, severity: 'high' 
    })
};