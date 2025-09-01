import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Local storage configuration
const STORAGE_BASE = path.join(process.cwd(), 'data');
const STUDENTS_DIR = path.join(STORAGE_BASE, 'students');
const EVENTS_DIR = path.join(STORAGE_BASE, 'events');
const METADATA_DIR = path.join(STORAGE_BASE, 'metadata');

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = [
    STORAGE_BASE,
    STUDENTS_DIR,
    EVENTS_DIR,
    METADATA_DIR,
    path.join(STUDENTS_DIR, 'batches'),
    path.join(STUDENTS_DIR, 'photos'),
    path.join(STUDENTS_DIR, 'profiles'),
    path.join(EVENTS_DIR, 'event-files'),
    path.join(EVENTS_DIR, 'photos'),
    path.join(EVENTS_DIR, 'reports'),
    path.join(EVENTS_DIR, 'attendance')
  ];

  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize storage directories
ensureDirectories();

// Generate unique ID for records
export const generateId = (): string => randomUUID();

// Sanitize filename to be filesystem-safe
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Get batch folder path
export const getBatchPath = (batchYear: string): string => {
  const sanitizedBatch = sanitizeFilename(batchYear);
  const batchPath = path.join(STUDENTS_DIR, 'batches', sanitizedBatch);
  
  if (!existsSync(batchPath)) {
    mkdirSync(batchPath, { recursive: true });
  }
  
  return batchPath;
};

// Student file operations
export class StudentStorage {
  static async saveStudent(studentData: any): Promise<string> {
    const id = generateId();
    const batchPath = getBatchPath(studentData.batchYear || 'unknown');
    const studentFile = path.join(batchPath, `${id}.json`);
    
    const studentRecord = {
      ...studentData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(studentFile, JSON.stringify(studentRecord, null, 2));
    return id;
  }

  static async getStudent(id: string): Promise<any | null> {
    try {
      // Search across all batch folders
      const batchesDir = path.join(STUDENTS_DIR, 'batches');
      const batches = await fs.readdir(batchesDir);
      
      for (const batch of batches) {
        const studentFile = path.join(batchesDir, batch, `${id}.json`);
        if (existsSync(studentFile)) {
          const data = await fs.readFile(studentFile, 'utf-8');
          return JSON.parse(data);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting student:', error);
      return null;
    }
  }

  static async updateStudent(id: string, updateData: any): Promise<boolean> {
    try {
      const student = await this.getStudent(id);
      if (!student) return false;

      const batchPath = getBatchPath(student.batchYear || 'unknown');
      const studentFile = path.join(batchPath, `${id}.json`);
      
      const updatedStudent = {
        ...student,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(studentFile, JSON.stringify(updatedStudent, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      return false;
    }
  }

  static async deleteStudent(id: string): Promise<boolean> {
    try {
      // Find and delete student file
      const batchesDir = path.join(STUDENTS_DIR, 'batches');
      const batches = await fs.readdir(batchesDir);
      
      for (const batch of batches) {
        const studentFile = path.join(batchesDir, batch, `${id}.json`);
        if (existsSync(studentFile)) {
          await fs.unlink(studentFile);
          
          // Also delete associated photo if exists
          const photoPath = path.join(STUDENTS_DIR, 'photos', `${id}.jpg`);
          if (existsSync(photoPath)) {
            await fs.unlink(photoPath);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  static async getAllStudents(filters?: any): Promise<any[]> {
    try {
      const students: any[] = [];
      const batchesDir = path.join(STUDENTS_DIR, 'batches');
      const batches = await fs.readdir(batchesDir);
      
      for (const batch of batches) {
        const batchDir = path.join(batchesDir, batch);
        const files = await fs.readdir(batchDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(batchDir, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const student = JSON.parse(data);
            students.push(student);
          }
        }
      }
      
      // Apply filters if provided
      if (filters) {
        return students.filter(student => {
          if (filters.batchYear && student.batchYear !== filters.batchYear) return false;
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            return student.name?.toLowerCase().includes(searchTerm) ||
                   student.rollNumber?.toLowerCase().includes(searchTerm) ||
                   student.email?.toLowerCase().includes(searchTerm);
          }
          return true;
        });
      }
      
      return students;
    } catch (error) {
      console.error('Error getting all students:', error);
      return [];
    }
  }

  static async saveStudentPhoto(studentId: string, photoBuffer: Buffer, contentType: string, filename: string): Promise<string> {
    try {
      const extension = path.extname(filename) || '.jpg';
      const photoPath = path.join(STUDENTS_DIR, 'photos', `${studentId}${extension}`);
      
      await fs.writeFile(photoPath, photoBuffer);
      
      // Update student record with photo info
      const student = await this.getStudent(studentId);
      if (student) {
        await this.updateStudent(studentId, {
          photoPath: photoPath,
          photoContentType: contentType,
          photoFileName: filename
        });
      }
      
      return photoPath;
    } catch (error) {
      console.error('Error saving student photo:', error);
      throw error;
    }
  }

  static async getStudentPhoto(studentId: string): Promise<{ buffer: Buffer, contentType: string } | null> {
    try {
      const student = await this.getStudent(studentId);
      if (!student || !student.photoPath) return null;
      
      if (existsSync(student.photoPath)) {
        const buffer = await fs.readFile(student.photoPath);
        return {
          buffer,
          contentType: student.photoContentType || 'image/jpeg'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting student photo:', error);
      return null;
    }
  }
}

// Event file operations
export class EventStorage {
  static async saveEvent(eventData: any): Promise<string> {
    const id = generateId();
    const eventDir = path.join(EVENTS_DIR, 'event-files');
    const eventFile = path.join(eventDir, `${id}.json`);
    
    const eventRecord = {
      ...eventData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(eventFile, JSON.stringify(eventRecord, null, 2));
    return id;
  }

  static async getEvent(id: string): Promise<any | null> {
    try {
      const eventFile = path.join(EVENTS_DIR, 'event-files', `${id}.json`);
      if (existsSync(eventFile)) {
        const data = await fs.readFile(eventFile, 'utf-8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  static async updateEvent(id: string, updateData: any): Promise<boolean> {
    try {
      const event = await this.getEvent(id);
      if (!event) return false;

      const eventFile = path.join(EVENTS_DIR, 'event-files', `${id}.json`);
      const updatedEvent = {
        ...event,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(eventFile, JSON.stringify(updatedEvent, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  static async deleteEvent(id: string): Promise<boolean> {
    try {
      const eventFile = path.join(EVENTS_DIR, 'event-files', `${id}.json`);
      if (existsSync(eventFile)) {
        await fs.unlink(eventFile);
        
        // Also delete associated files
        const folders = ['photos', 'reports', 'attendance'];
        for (const folder of folders) {
          const folderPath = path.join(EVENTS_DIR, folder);
          const files = await fs.readdir(folderPath);
          
          for (const file of files) {
            if (file.startsWith(id)) {
              await fs.unlink(path.join(folderPath, file));
            }
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  static async getAllEvents(filters?: any): Promise<any[]> {
    try {
      const events: any[] = [];
      const eventFilesDir = path.join(EVENTS_DIR, 'event-files');
      const files = await fs.readdir(eventFilesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(eventFilesDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const event = JSON.parse(data);
          events.push(event);
        }
      }
      
      // Apply filters if provided
      if (filters) {
        return events.filter(event => {
          if (filters.status && event.status !== filters.status) return false;
          if (filters.eventType && event.eventType !== filters.eventType) return false;
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            return event.title?.toLowerCase().includes(searchTerm) ||
                   event.location?.toLowerCase().includes(searchTerm) ||
                   event.description?.toLowerCase().includes(searchTerm);
          }
          return true;
        });
      }
      
      return events;
    } catch (error) {
      console.error('Error getting all events:', error);
      return [];
    }
  }

  static async saveEventFile(eventId: string, fileBuffer: Buffer, fileType: 'photo' | 'report' | 'attendance', filename: string): Promise<string> {
    try {
      const extension = path.extname(filename);
      const sanitizedName = sanitizeFilename(filename);
      const timestamp = Date.now();
      const finalFilename = `${eventId}_${timestamp}_${sanitizedName}`;
      
      const filePath = path.join(EVENTS_DIR, `${fileType}s`, finalFilename);
      await fs.writeFile(filePath, fileBuffer);
      
      return filePath;
    } catch (error) {
      console.error('Error saving event file:', error);
      throw error;
    }
  }

  static async getEventFile(filePath: string): Promise<{ buffer: Buffer, contentType: string } | null> {
    try {
      if (existsSync(filePath)) {
        const buffer = await fs.readFile(filePath);
        const extension = path.extname(filePath).toLowerCase();
        
        let contentType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(extension)) contentType = 'image/jpeg';
        else if (extension === '.png') contentType = 'image/png';
        else if (extension === '.pdf') contentType = 'application/pdf';
        else if (['.doc', '.docx'].includes(extension)) contentType = 'application/msword';
        else if (['.xls', '.xlsx'].includes(extension)) contentType = 'application/vnd.ms-excel';
        
        return { buffer, contentType };
      }
      return null;
    } catch (error) {
      console.error('Error getting event file:', error);
      return null;
    }
  }
}

// Analytics and metadata operations
export class MetadataStorage {
  static async saveMetadata(key: string, data: any): Promise<void> {
    const filePath = path.join(METADATA_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  static async getMetadata(key: string): Promise<any | null> {
    try {
      const filePath = path.join(METADATA_DIR, `${key}.json`);
      if (existsSync(filePath)) {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error getting metadata:', error);
      return null;
    }
  }
}

export { STORAGE_BASE, STUDENTS_DIR, EVENTS_DIR, METADATA_DIR };