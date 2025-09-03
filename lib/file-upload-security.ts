// File upload security utilities
import { writeFile, readFile, mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 100 * 1024 * 1024, // 100MB total storage
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocumentTypes: ['application/pdf', 'text/csv', 'application/json'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.csv', '.json'],
  scanForMalware: true,
  quarantineSuspicious: true,
  virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY // Optional external scanning
};

// Dangerous file patterns to block
const DANGEROUS_PATTERNS = [
  /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg)$/i,
  /\.(php|asp|aspx|jsp|py|rb|pl|sh|bash)$/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi
];

// Magic bytes for file type validation
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46]
};

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    originalName: string;
    sanitizedName: string;
    size: number;
    type: string;
    extension: string;
    hash: string;
  };
}

export interface UploadSecurityOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  sanitizeFilename?: boolean;
  scanContent?: boolean;
  generateHash?: boolean;
}

export async function validateFileUpload(
  file: Buffer | { arrayBuffer: () => Promise<ArrayBuffer> },
  originalName: string,
  options: UploadSecurityOptions = {}
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get file buffer
  const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
  
  // Basic file info
  const extension = path.extname(originalName).toLowerCase();
  const sanitizedName = sanitizeFilename(originalName);
  const fileSize = buffer.length;
  const fileHash = generateFileHash(buffer);
  
  // Detect file type from content
  const detectedType = detectFileType(buffer);
  
  const fileInfo = {
    originalName,
    sanitizedName,
    size: fileSize,
    type: detectedType || 'unknown',
    extension,
    hash: fileHash
  };

  // Size validation
  const maxSize = options.maxFileSize || UPLOAD_CONFIG.maxFileSize;
  if (fileSize > maxSize) {
    errors.push(`File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds limit (${Math.round(maxSize / 1024 / 1024)}MB)`);
  }

  if (fileSize === 0) {
    errors.push('File is empty');
  }

  // Extension validation
  const allowedExtensions = options.allowedExtensions || UPLOAD_CONFIG.allowedExtensions;
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension '${extension}' is not allowed`);
  }

  // MIME type validation
  const allowedTypes = options.allowedTypes || [
    ...UPLOAD_CONFIG.allowedImageTypes,
    ...UPLOAD_CONFIG.allowedDocumentTypes
  ];
  
  if (detectedType && !allowedTypes.includes(detectedType)) {
    errors.push(`File type '${detectedType}' is not allowed`);
  }

  // Check for dangerous patterns
  const fileContent = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(originalName) || pattern.test(fileContent)) {
      errors.push('File contains potentially dangerous content');
      break;
    }
  }

  // Filename validation
  if (originalName.length > 255) {
    errors.push('Filename is too long');
  }

  if (originalName !== sanitizedName) {
    warnings.push('Filename was sanitized for security');
  }

  // Content scanning (basic)
  if (options.scanContent !== false) {
    const contentWarnings = scanFileContent(buffer);
    warnings.push(...contentWarnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo
  };
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = path.basename(filename);
  
  // Replace dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Prevent reserved names (Windows)
  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = path.parse(sanitized).name.toUpperCase();
  if (reserved.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`;
  }
  
  // Ensure it's not empty
  if (!sanitized || sanitized === '.') {
    sanitized = `file_${Date.now()}`;
  }
  
  return sanitized;
}

export function detectFileType(buffer: Buffer): string | null {
  // Check magic bytes
  for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
    if (buffer.length >= signature.length) {
      const match = signature.every((byte, index) => buffer[index] === byte);
      if (match) return mimeType;
    }
  }
  
  // Additional checks for other formats
  if (buffer.length >= 4) {
    // Check for WEBP (RIFF format)
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && 
        buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
  }
  
  return null;
}

export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function scanFileContent(buffer: Buffer): string[] {
  const warnings: string[] = [];
  
  // Convert to string for text-based scanning
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  
  // Check for embedded scripts
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    warnings.push('File contains embedded JavaScript');
  }
  
  // Check for suspicious URLs
  if (/https?:\/\/[^\s<>"']+/gi.test(content)) {
    warnings.push('File contains URLs');
  }
  
  // Check for macros (Office documents)
  if (/\b(macro|vba|activex)\b/gi.test(content)) {
    warnings.push('File may contain macros');
  }
  
  return warnings;
}

export async function quarantineFile(
  filePath: string,
  reason: string
): Promise<string> {
  const quarantinePath = './storage/quarantine';
  
  try {
    if (!existsSync(quarantinePath)) {
      await mkdir(quarantinePath, { recursive: true });
    }
    
    const originalName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const quarantineFilename = `${timestamp}_${originalName}`;
    const quarantineFile = path.join(quarantinePath, quarantineFilename);
    
    // Move file to quarantine
    const content = await readFile(filePath);
    await writeFile(quarantineFile, content);
    
    // Create quarantine log
    const logEntry = {
      originalPath: filePath,
      quarantinePath: quarantineFile,
      reason,
      timestamp: new Date().toISOString(),
      hash: generateFileHash(content)
    };
    
    const logPath = path.join(quarantinePath, 'quarantine.log');
    await writeFile(logPath, JSON.stringify(logEntry) + '\n', { flag: 'a' });
    
    return quarantineFile;
    
  } catch (error) {
    console.error('Failed to quarantine file:', error);
    throw new Error('Failed to quarantine suspicious file');
  }
}

export async function checkStorageQuota(): Promise<{
  used: number;
  available: number;
  percentage: number;
  warning: boolean;
}> {
  try {
    const storagePath = './storage';
    const totalSize = await calculateDirectorySize(storagePath);
    const maxSize = UPLOAD_CONFIG.maxTotalSize;
    const percentage = (totalSize / maxSize) * 100;
    
    return {
      used: totalSize,
      available: maxSize - totalSize,
      percentage,
      warning: percentage > 80
    };
  } catch (error) {
    console.error('Failed to check storage quota:', error);
    return {
      used: 0,
      available: UPLOAD_CONFIG.maxTotalSize,
      percentage: 0,
      warning: false
    };
  }
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
  if (!existsSync(dirPath)) return 0;
  
  let totalSize = 0;
  
  try {
    const { readdir } = await import('fs/promises');
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        totalSize += await calculateDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error(`Error calculating size for ${dirPath}:`, error);
  }
  
  return totalSize;
}

// Utility function to create secure file paths
export function createSecureFilePath(
  basePath: string,
  filename: string,
  subDirectory?: string
): string {
  const sanitizedFilename = sanitizeFilename(filename);
  const safePath = subDirectory 
    ? path.join(basePath, subDirectory.replace(/[^a-zA-Z0-9_-]/g, '_'), sanitizedFilename)
    : path.join(basePath, sanitizedFilename);
  
  // Ensure the path doesn't escape the base directory
  const resolvedPath = path.resolve(safePath);
  const resolvedBase = path.resolve(basePath);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Invalid file path: potential directory traversal');
  }
  
  return resolvedPath;
}