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
    path.join(EVENTS_DIR, 'years')
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

// Get event year and month from date
export const getEventYearMonth = (eventDate: string | Date): { year: string, month: string } => {
  const date = new Date(eventDate);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  return { year, month };
};

// Get event folder path organized by year/month
export const getEventPath = (eventDate: string | Date, eventId: string): string => {
  const { year, month } = getEventYearMonth(eventDate);
  const sanitizedEventId = sanitizeFilename(eventId);
  const eventPath = path.join(EVENTS_DIR, 'years', year, month, sanitizedEventId);
  
  if (!existsSync(eventPath)) {
    mkdirSync(eventPath, { recursive: true });
  }
  
  return eventPath;
};

// Get event metadata folder path
export const getEventMetadataPath = (eventDate: string | Date): string => {
  const { year, month } = getEventYearMonth(eventDate);
  const metadataPath = path.join(EVENTS_DIR, 'years', year, month);
  
  if (!existsSync(metadataPath)) {
    mkdirSync(metadataPath, { recursive: true });
  }
  
  return metadataPath;
};

// Student file operations
export class StudentStorage {
  static async saveStudent(studentData: any): Promise<string> {
    try {
      // Validate required fields
      if (!studentData.name || !studentData.rollNumber) {
        throw new Error('Name and roll number are required');
      }

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
    } catch (error) {
      console.error('Error saving student:', error);
      throw new Error('Failed to save student data');
    }
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
          const student = JSON.parse(data);
          
          // Ensure photo field is set correctly for UI consumption
          if (student.photoPath && existsSync(student.photoPath)) {
            student.photo = `/api/students/${student.id}/photo`;
          } else {
            student.photo = null;
          }
          
          return student;
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
          // Read student data before deleting to get photo path
          const data = await fs.readFile(studentFile, 'utf-8');
          const student = JSON.parse(data);
          
          // Delete student file
          await fs.unlink(studentFile);
          
          // Delete associated photo if exists
          if (student.photoPath && existsSync(student.photoPath)) {
            await fs.unlink(student.photoPath);
          }
          
          // Also try to delete by roll number for legacy compatibility
          const legacyPhotoPath = path.join(STUDENTS_DIR, 'photos', `${id}.jpg`);
          if (existsSync(legacyPhotoPath)) {
            await fs.unlink(legacyPhotoPath);
          }
          
          // Try to delete by roll number in batch folder
          if (student.rollNumber) {
            const sanitizedRollNumber = sanitizeFilename(student.rollNumber);
            const rollPhotoPath = path.join(batchesDir, batch, `${sanitizedRollNumber}.jpg`);
            if (existsSync(rollPhotoPath)) {
              await fs.unlink(rollPhotoPath);
            }
            const rollPhotoPathPng = path.join(batchesDir, batch, `${sanitizedRollNumber}.png`);
            if (existsSync(rollPhotoPathPng)) {
              await fs.unlink(rollPhotoPathPng);
            }
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
      
      // Check if batches directory exists
      if (!existsSync(batchesDir)) {
        console.warn('Batches directory does not exist, creating it');
        mkdirSync(batchesDir, { recursive: true });
        return [];
      }

      const batches = await fs.readdir(batchesDir);
      
      for (const batch of batches) {
        const batchDir = path.join(batchesDir, batch);
        
        try {
          const files = await fs.readdir(batchDir);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                const filePath = path.join(batchDir, file);
                const data = await fs.readFile(filePath, 'utf-8');
                const student = JSON.parse(data);
                
                // Ensure photo field is set correctly for UI consumption
                if (student.photoPath && existsSync(student.photoPath)) {
                  student.photo = `/api/students/${student.id}/photo`;
                } else {
                  student.photo = null;
                }
                
                students.push(student);
              } catch (fileError) {
                console.warn(`Error reading student file ${file}:`, fileError);
                // Continue with other files
              }
            }
          }
        } catch (batchError) {
          console.warn(`Error reading batch directory ${batch}:`, batchError);
          // Continue with other batches
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
      const student = await this.getStudent(studentId);
      if (!student) {
        throw new Error('Student not found');
      }
      
      const extension = path.extname(filename) || '.jpg';
      const batchPath = getBatchPath(student.batchYear || 'unknown');
      
      // Sanitize roll number for filename
      const sanitizedRollNumber = sanitizeFilename(student.rollNumber);
      const photoFileName = `${sanitizedRollNumber}${extension}`;
      const photoPath = path.join(batchPath, photoFileName);
      
      // Remove old photo if it exists
      if (student.photoPath && existsSync(student.photoPath)) {
        await fs.unlink(student.photoPath);
      }
      
      await fs.writeFile(photoPath, photoBuffer);
      
      // Update student record with photo info
      await this.updateStudent(studentId, {
        photoPath: photoPath,
        photoContentType: contentType,
        photoFileName: photoFileName,
        photoUrl: `/api/students/${studentId}/photo`
      });
      
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
    try {
      // Validate required fields
      if (!eventData.title || !eventData.eventDate) {
        throw new Error('Title and event date are required');
      }

      const id = generateId();
      const eventMetadataDir = getEventMetadataPath(eventData.eventDate);
      const eventFile = path.join(eventMetadataDir, `${id}.json`);
      
      const eventRecord = {
        ...eventData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(eventFile, JSON.stringify(eventRecord, null, 2));
      return id;
    } catch (error) {
      console.error('Error saving event:', error);
      throw new Error('Failed to save event data');
    }
  }

  static async getEvent(id: string): Promise<any | null> {
    try {
      // Search through all year/month directories to find the event
      const yearsDir = path.join(EVENTS_DIR, 'years');
      if (!existsSync(yearsDir)) return null;
      
      const years = await fs.readdir(yearsDir);
      for (const year of years) {
        const yearPath = path.join(yearsDir, year);
        const months = await fs.readdir(yearPath);
        for (const month of months) {
          const monthPath = path.join(yearPath, month);
          const eventFile = path.join(monthPath, `${id}.json`);
          if (existsSync(eventFile)) {
            const data = await fs.readFile(eventFile, 'utf-8');
            return JSON.parse(data);
          }
        }
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

      // Find the event file location
      const eventMetadataDir = getEventMetadataPath(event.eventDate);
      const eventFile = path.join(eventMetadataDir, `${id}.json`);
      
      const updatedEvent = {
        ...event,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      // If event date changed, move to new location
      if (updateData.eventDate && updateData.eventDate !== event.eventDate) {
        const newMetadataDir = getEventMetadataPath(updateData.eventDate);
        const newEventFile = path.join(newMetadataDir, `${id}.json`);
        
        // Save to new location and delete old one
        await fs.writeFile(newEventFile, JSON.stringify(updatedEvent, null, 2));
        if (existsSync(eventFile)) {
          await fs.unlink(eventFile);
        }
        
        // Move media files if they exist
        const oldMediaPath = getEventPath(event.eventDate, id);
        const newMediaPath = getEventPath(updateData.eventDate, id);
        if (existsSync(oldMediaPath) && oldMediaPath !== newMediaPath) {
          // Move files to new location
          const files = await fs.readdir(oldMediaPath);
          for (const file of files) {
            const oldFile = path.join(oldMediaPath, file);
            const newFile = path.join(newMediaPath, file);
            await fs.rename(oldFile, newFile);
          }
          // Remove old directory
          await fs.rmdir(oldMediaPath);
        }
      } else {
        // Just update in current location
        await fs.writeFile(eventFile, JSON.stringify(updatedEvent, null, 2));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }

  static async deleteEvent(id: string): Promise<boolean> {
    try {
      // Get event first to know its location
      const event = await this.getEvent(id);
      if (!event) return false;
      
      // Delete event metadata file
      const eventMetadataDir = getEventMetadataPath(event.eventDate);
      const eventFile = path.join(eventMetadataDir, `${id}.json`);
      if (existsSync(eventFile)) {
        await fs.unlink(eventFile);
      }
      
      // Delete associated event media folder
      const eventMediaPath = getEventPath(event.eventDate, id);
      if (existsSync(eventMediaPath)) {
        const files = await fs.readdir(eventMediaPath);
        for (const file of files) {
          await fs.unlink(path.join(eventMediaPath, file));
        }
        // Remove the directory itself
        await fs.rmdir(eventMediaPath);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  static async getAllEvents(filters?: any): Promise<any[]> {
    try {
      const events: any[] = [];
      const yearsDir = path.join(EVENTS_DIR, 'years');
      
      if (!existsSync(yearsDir)) return events;
      
      const years = await fs.readdir(yearsDir);
      for (const year of years) {
        const yearPath = path.join(yearsDir, year);
        const months = await fs.readdir(yearPath);
        for (const month of months) {
          const monthPath = path.join(yearPath, month);
          const files = await fs.readdir(monthPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(monthPath, file);
              const data = await fs.readFile(filePath, 'utf-8');
              const event = JSON.parse(data);
              events.push(event);
            }
          }
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

  static async saveEventFile(eventId: string, eventDate: string | Date, fileBuffer: Buffer, fileType: 'photo' | 'report' | 'attendance', filename: string): Promise<string> {
    try {
      const extension = path.extname(filename);
      const sanitizedName = sanitizeFilename(path.basename(filename, extension));
      const timestamp = Date.now();
      const finalFilename = `${fileType}_${timestamp}_${sanitizedName}${extension}`;
      
      const eventPath = getEventPath(eventDate, eventId);
      const filePath = path.join(eventPath, finalFilename);
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