import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Storage configuration
const STORAGE_BASE = process.env.STORAGE_BASE_PATH || './storage';

// Allowed file types and sizes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/csv', 'application/vnd.ms-excel'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// File type validation
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export function validateImageFile(mimeType: string): boolean {
  return validateFileType(mimeType, ALLOWED_IMAGE_TYPES);
}

export function validateDocumentFile(mimeType: string): boolean {
  return validateFileType(mimeType, ALLOWED_DOCUMENT_TYPES);
}

// Path sanitization to prevent directory traversal
export function sanitizePath(inputPath: string): string {
  // Remove any path traversal attempts
  const sanitized = inputPath.replace(/\.\./g, '').replace(/[\/\\]/g, '-');
  return sanitized;
}

// Ensure directory exists
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Generate safe filename
export function generateSafeFileName(originalName: string, extension?: string): string {
  const timestamp = Date.now();
  const hash = createHash('md5').update(originalName + timestamp).digest('hex').slice(0, 8);
  const safeName = sanitizePath(originalName.replace(/\.[^/.]+$/, ""));
  const ext = extension || path.extname(originalName);
  return `${safeName}_${hash}${ext}`;
}

// Student photo storage
export async function saveStudentProfilePhoto(
  batch: string, 
  rollNo: string, 
  fileBuffer: Buffer, 
  mimeType: string, 
  originalName: string
): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
  try {
    if (!validateImageFile(mimeType)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' };
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds maximum limit of 10MB.' };
    }

    const sanitizedBatch = sanitizePath(batch);
    const sanitizedRollNo = sanitizePath(rollNo);
    
    const studentDir = path.join(STORAGE_BASE, 'students', sanitizedBatch, sanitizedRollNo);
    await ensureDirectory(studentDir);

    // Use consistent filename for profile photo
    const extension = mimeType === 'image/jpeg' ? '.jpg' : 
                     mimeType === 'image/png' ? '.png' : '.webp';
    const fileName = `profile${extension}`;
    const filePath = path.join(studentDir, fileName);

    await fs.writeFile(filePath, fileBuffer);

    const photoUrl = `/storage/students/${sanitizedBatch}/${sanitizedRollNo}/${fileName}`;
    return { success: true, photoUrl };
  } catch (error) {
    
    return { success: false, error: 'Failed to save profile photo.' };
  }
}

// Event file storage
export async function saveEventFile(
  year: string,
  month: string,
  eventId: string,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
  fileType: 'photos' | 'reports' | 'attendance'
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(mimeType);
    
    if (!isImage && !isDocument) {
      return { success: false, error: 'Invalid file type.' };
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds maximum limit.' };
    }

    const sanitizedYear = sanitizePath(year);
    const sanitizedMonth = sanitizePath(month);
    const sanitizedEventId = sanitizePath(eventId);
    
    const eventDir = path.join(STORAGE_BASE, 'events', sanitizedYear, sanitizedMonth, sanitizedEventId, fileType);
    await ensureDirectory(eventDir);

    const fileName = generateSafeFileName(originalName);
    const filePath = path.join(eventDir, fileName);

    await fs.writeFile(filePath, fileBuffer);

    const fileUrl = `/storage/events/${sanitizedYear}/${sanitizedMonth}/${sanitizedEventId}/${fileType}/${fileName}`;
    return { success: true, fileUrl };
  } catch (error) {
    
    return { success: false, error: 'Failed to save event file.' };
  }
}

// Metadata operations
export async function saveMetadata(metadataPath: string, data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const dir = path.dirname(metadataPath);
    await ensureDirectory(dir);
    await fs.writeFile(metadataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    
    return { success: false, error: 'Failed to save metadata.' };
  }
}

export async function readMetadata(metadataPath: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Metadata file not found or invalid.' };
  }
}

// Directory operations
export async function deleteFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    
    return { success: false, error: 'Failed to delete folder.' };
  }
}

// List files in directory
export async function listFiles(dirPath: string): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const files = await fs.readdir(dirPath);
    return { success: true, files };
  } catch (error) {
    return { success: false, error: 'Directory not found or inaccessible.' };
  }
}

// Student metadata helpers
export async function saveStudentMetadata(batch: string, rollNo: string, studentData: any): Promise<{ success: boolean; error?: string }> {
  const sanitizedBatch = sanitizePath(batch);
  const sanitizedRollNo = sanitizePath(rollNo);
  const metadataPath = path.join(STORAGE_BASE, 'students', sanitizedBatch, sanitizedRollNo, 'metadata.json');
  return saveMetadata(metadataPath, studentData);
}

export async function getStudentMetadata(batch: string, rollNo: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const sanitizedBatch = sanitizePath(batch);
  const sanitizedRollNo = sanitizePath(rollNo);
  const metadataPath = path.join(STORAGE_BASE, 'students', sanitizedBatch, sanitizedRollNo, 'metadata.json');
  return readMetadata(metadataPath);
}

// Event metadata helpers
export async function saveEventMetadata(year: string, month: string, eventId: string, eventData: any): Promise<{ success: boolean; error?: string }> {
  const sanitizedYear = sanitizePath(year);
  const sanitizedMonth = sanitizePath(month);
  const sanitizedEventId = sanitizePath(eventId);
  const metadataPath = path.join(STORAGE_BASE, 'events', sanitizedYear, sanitizedMonth, sanitizedEventId, 'metadata.json');
  return saveMetadata(metadataPath, eventData);
}

export async function getEventMetadata(year: string, month: string, eventId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const sanitizedYear = sanitizePath(year);
  const sanitizedMonth = sanitizePath(month);
  const sanitizedEventId = sanitizePath(eventId);
  const metadataPath = path.join(STORAGE_BASE, 'events', sanitizedYear, sanitizedMonth, sanitizedEventId, 'metadata.json');
  return readMetadata(metadataPath);
}

// Initialize storage directory structure
export async function initializeStorage(): Promise<void> {
  const directories = [
    path.join(STORAGE_BASE, 'students'),
    path.join(STORAGE_BASE, 'events'),
    path.join(STORAGE_BASE, 'logs'),
    path.join(STORAGE_BASE, 'backups')
  ];

  for (const dir of directories) {
    await ensureDirectory(dir);
  }
}