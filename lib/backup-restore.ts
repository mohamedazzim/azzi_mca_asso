// Data backup and restore system
import { writeFile, readFile, mkdir, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  description: string;
  createdBy: string;
  size: number;
  checksum: string;
  includes: BackupIncludes;
}

export interface BackupIncludes {
  students: boolean;
  events: boolean;
  users: boolean;
  logs: boolean;
  media: boolean;
}

export interface BackupListItem {
  id: string;
  timestamp: string;
  description: string;
  size: number;
  createdBy: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restored: {
    students: number;
    events: number;
    users: number;
    mediaFiles: number;
  };
  errors: string[];
}

const BACKUP_PATH = './storage/backups';
const DATA_PATHS = {
  students: './storage/students',
  events: './storage/events',
  users: './data/users.json',
  logs: './storage/logs'
};

export class BackupManager {
  private static instance: BackupManager;

  private constructor() {
    this.ensureBackupDirectory();
  }

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      if (!existsSync(BACKUP_PATH)) {
        await mkdir(BACKUP_PATH, { recursive: true });
      }
    } catch (error) {
      
    }
  }

  public async createBackup(
    description: string,
    createdBy: string,
    includes: BackupIncludes = {
      students: true,
      events: true,
      users: true,
      logs: false,
      media: true
    }
  ): Promise<string> {
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    
    try {
      // Create backup directory
      const backupDir = path.join(BACKUP_PATH, backupId);
      await mkdir(backupDir, { recursive: true });

      // Backup data based on includes
      const backupData: any = {};

      if (includes.students) {
        backupData.students = await this.backupStudents();
      }

      if (includes.events) {
        backupData.events = await this.backupEvents();
      }

      if (includes.users) {
        backupData.users = await this.backupUsers();
      }

      if (includes.logs) {
        backupData.logs = await this.backupLogs();
      }

      // Save main data file
      const dataFile = path.join(backupDir, 'data.json');
      await writeFile(dataFile, JSON.stringify(backupData, null, 2));

      // Backup media files if requested
      if (includes.media) {
        await this.backupMediaFiles(backupDir);
      }

      // Calculate backup size and checksum
      const backupSize = await this.calculateBackupSize(backupDir);
      const checksum = await this.calculateChecksum(dataFile);

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        description,
        createdBy,
        size: backupSize,
        checksum,
        includes
      };

      // Save metadata
      const metadataFile = path.join(backupDir, 'metadata.json');
      await writeFile(metadataFile, JSON.stringify(metadata, null, 2));

      // Compress backup (optional)
      if (backupSize > 10 * 1024 * 1024) { // Only compress if > 10MB
        await this.compressBackup(backupDir);
      }

      return backupId;

    } catch (error) {
      
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 8);
    return `backup-${timestamp}-${random}`;
  }

  private async backupStudents(): Promise<any[]> {
    try {
      const studentsDir = DATA_PATHS.students;
      if (!existsSync(studentsDir)) {
        return [];
      }

      const students: any[] = [];
      const batches = await readdir(studentsDir);

      for (const batch of batches) {
        const batchPath = path.join(studentsDir, batch);
        const batchStat = await stat(batchPath);
        
        if (batchStat.isDirectory()) {
          const studentFiles = await readdir(batchPath);
          
          for (const studentFile of studentFiles) {
            if (studentFile.endsWith('.json')) {
              const studentPath = path.join(batchPath, studentFile);
              const studentData = await readFile(studentPath, 'utf8');
              students.push(JSON.parse(studentData));
            }
          }
        }
      }

      return students;
    } catch (error) {
      
      return [];
    }
  }

  private async backupEvents(): Promise<any[]> {
    try {
      const eventsDir = DATA_PATHS.events;
      if (!existsSync(eventsDir)) {
        return [];
      }

      const events: any[] = [];
      
      // Recursively read event files
      const readEventFiles = async (dir: string): Promise<void> => {
        const entries = await readdir(dir);
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry);
          const entryStat = await stat(entryPath);
          
          if (entryStat.isDirectory()) {
            await readEventFiles(entryPath);
          } else if (entry.endsWith('.json')) {
            const eventData = await readFile(entryPath, 'utf8');
            events.push(JSON.parse(eventData));
          }
        }
      };

      await readEventFiles(eventsDir);
      return events;
    } catch (error) {
      
      return [];
    }
  }

  private async backupUsers(): Promise<any[]> {
    try {
      const usersFile = DATA_PATHS.users;
      if (!existsSync(usersFile)) {
        return [];
      }

      const usersData = await readFile(usersFile, 'utf8');
      return JSON.parse(usersData) || [];
    } catch (error) {
      
      return [];
    }
  }

  private async backupLogs(): Promise<any[]> {
    try {
      const logsDir = DATA_PATHS.logs;
      if (!existsSync(logsDir)) {
        return [];
      }

      const logs: any[] = [];
      const logFiles = await readdir(logsDir);

      for (const logFile of logFiles) {
        if (logFile.endsWith('.log')) {
          const logPath = path.join(logsDir, logFile);
          const logContent = await readFile(logPath, 'utf8');
          const logEntries = logContent.trim().split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return { raw: line };
              }
            });
          logs.push(...logEntries);
        }
      }

      return logs;
    } catch (error) {
      
      return [];
    }
  }

  private async backupMediaFiles(backupDir: string): Promise<void> {
    const mediaDir = path.join(backupDir, 'media');
    await mkdir(mediaDir, { recursive: true });

    // Copy media files from students and events
    await this.copyMediaFiles('./storage/students', path.join(mediaDir, 'students'));
    await this.copyMediaFiles('./storage/events', path.join(mediaDir, 'events'));
  }

  private async copyMediaFiles(sourceDir: string, targetDir: string): Promise<void> {
    if (!existsSync(sourceDir)) return;

    try {
      await mkdir(targetDir, { recursive: true });
      
      const copyRecursively = async (src: string, dest: string): Promise<void> => {
        const entries = await readdir(src);
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry);
          const destPath = path.join(dest, entry);
          const entryStat = await stat(srcPath);
          
          if (entryStat.isDirectory()) {
            await mkdir(destPath, { recursive: true });
            await copyRecursively(srcPath, destPath);
          } else {
            // Copy file
            await pipeline(
              createReadStream(srcPath),
              createWriteStream(destPath)
            );
          }
        }
      };

      await copyRecursively(sourceDir, targetDir);
    } catch (error) {
      
    }
  }

  private async calculateBackupSize(backupDir: string): Promise<number> {
    let totalSize = 0;

    const calculateDirSize = async (dir: string): Promise<void> => {
      const entries = await readdir(dir);
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        const entryStat = await stat(entryPath);
        
        if (entryStat.isDirectory()) {
          await calculateDirSize(entryPath);
        } else {
          totalSize += entryStat.size;
        }
      }
    };

    await calculateDirSize(backupDir);
    return totalSize;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto');
    const content = await readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async compressBackup(backupDir: string): Promise<void> {
    // This would implement backup compression
    // For now, we'll skip compression
    
  }

  public async listBackups(): Promise<BackupListItem[]> {
    try {
      if (!existsSync(BACKUP_PATH)) {
        return [];
      }

      const backups: BackupListItem[] = [];
      const backupDirs = await readdir(BACKUP_PATH);

      for (const backupDir of backupDirs) {
        const backupPath = path.join(BACKUP_PATH, backupDir);
        const backupStat = await stat(backupPath);
        
        if (backupStat.isDirectory()) {
          const metadataPath = path.join(backupPath, 'metadata.json');
          
          if (existsSync(metadataPath)) {
            try {
              const metadataContent = await readFile(metadataPath, 'utf8');
              const metadata: BackupMetadata = JSON.parse(metadataContent);
              
              backups.push({
                id: metadata.id,
                timestamp: metadata.timestamp,
                description: metadata.description,
                size: metadata.size,
                createdBy: metadata.createdBy
              });
            } catch (error) {
              
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      
      return [];
    }
  }

  public async restoreBackup(backupId: string, options: {
    restoreStudents?: boolean;
    restoreEvents?: boolean;
    restoreUsers?: boolean;
    overwriteExisting?: boolean;
  } = {}): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      message: '',
      restored: {
        students: 0,
        events: 0,
        users: 0,
        mediaFiles: 0
      },
      errors: []
    };

    try {
      const backupDir = path.join(BACKUP_PATH, backupId);
      
      if (!existsSync(backupDir)) {
        throw new Error('Backup not found');
      }

      // Read backup metadata
      const metadataPath = path.join(backupDir, 'metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf8');
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      // Read backup data
      const dataPath = path.join(backupDir, 'data.json');
      const dataContent = await readFile(dataPath, 'utf8');
      const backupData = JSON.parse(dataContent);

      // Restore students
      if (options.restoreStudents !== false && backupData.students) {
        result.restored.students = await this.restoreStudents(backupData.students, options.overwriteExisting);
      }

      // Restore events
      if (options.restoreEvents !== false && backupData.events) {
        result.restored.events = await this.restoreEvents(backupData.events, options.overwriteExisting);
      }

      // Restore users
      if (options.restoreUsers !== false && backupData.users) {
        result.restored.users = await this.restoreUsers(backupData.users, options.overwriteExisting);
      }

      // Restore media files
      const mediaDir = path.join(backupDir, 'media');
      if (existsSync(mediaDir)) {
        result.restored.mediaFiles = await this.restoreMediaFiles(mediaDir);
      }

      result.success = true;
      result.message = `Successfully restored backup from ${new Date(metadata.timestamp).toLocaleString()}`;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.message = 'Restore failed';
    }

    return result;
  }

  private async restoreStudents(students: any[], overwrite: boolean = false): Promise<number> {
    let restored = 0;

    for (const student of students) {
      try {
        const batch = student.batchYear || student.batch || '2024';
        const studentDir = path.join(DATA_PATHS.students, batch);
        await mkdir(studentDir, { recursive: true });

        const studentFile = path.join(studentDir, `${student.id}.json`);
        
        if (overwrite || !existsSync(studentFile)) {
          await writeFile(studentFile, JSON.stringify(student, null, 2));
          restored++;
        }
      } catch (error) {
        
      }
    }

    return restored;
  }

  private async restoreEvents(events: any[], overwrite: boolean = false): Promise<number> {
    let restored = 0;

    for (const event of events) {
      try {
        const eventDate = new Date(event.eventDate || event.date);
        const year = eventDate.getFullYear().toString();
        const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
        
        const eventDir = path.join(DATA_PATHS.events, year, month);
        await mkdir(eventDir, { recursive: true });

        const eventFile = path.join(eventDir, `${event.id}.json`);
        
        if (overwrite || !existsSync(eventFile)) {
          await writeFile(eventFile, JSON.stringify(event, null, 2));
          restored++;
        }
      } catch (error) {
        
      }
    }

    return restored;
  }

  private async restoreUsers(users: any[], overwrite: boolean = false): Promise<number> {
    try {
      if (overwrite || !existsSync(DATA_PATHS.users)) {
        await writeFile(DATA_PATHS.users, JSON.stringify(users, null, 2));
        return users.length;
      }
    } catch (error) {
      
    }
    
    return 0;
  }

  private async restoreMediaFiles(mediaDir: string): Promise<number> {
    let restored = 0;

    try {
      // Restore student media
      const studentMediaDir = path.join(mediaDir, 'students');
      if (existsSync(studentMediaDir)) {
        await this.copyMediaFiles(studentMediaDir, './storage/students');
        restored += await this.countFiles(studentMediaDir);
      }

      // Restore event media
      const eventMediaDir = path.join(mediaDir, 'events');
      if (existsSync(eventMediaDir)) {
        await this.copyMediaFiles(eventMediaDir, './storage/events');
        restored += await this.countFiles(eventMediaDir);
      }
    } catch (error) {
      
    }

    return restored;
  }

  private async countFiles(dir: string): Promise<number> {
    let count = 0;

    const countRecursively = async (path: string): Promise<void> => {
      const entries = await readdir(path);
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        const entryStat = await stat(entryPath);
        
        if (entryStat.isDirectory()) {
          await countRecursively(entryPath);
        } else {
          count++;
        }
      }
    };

    await countRecursively(dir);
    return count;
  }

  public async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupDir = path.join(BACKUP_PATH, backupId);
      
      if (existsSync(backupDir)) {
        // In a real implementation, you'd recursively delete the directory
        // For now, we'll just log the operation
        
        return true;
      }
      
      return false;
    } catch (error) {
      
      return false;
    }
  }
}

// Singleton instance
export const backupManager = BackupManager.getInstance();