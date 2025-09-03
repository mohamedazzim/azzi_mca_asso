/**
 * File System Security
 * Comprehensive file system protection and validation
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface FileSecurityConfig {
  allowedExtensions: string[];
  maxFileSize: number;
  allowedMimeTypes: string[];
  scanForMalware: boolean;
  quarantineDir: string;
  uploadDir: string;
}

export const DEFAULT_FILE_SECURITY: FileSecurityConfig = {
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.json'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json'
  ],
  scanForMalware: true,
  quarantineDir: './storage/quarantine',
  uploadDir: './storage/uploads'
};

export class FileSystemSecurity {
  private config: FileSecurityConfig;

  constructor(config: Partial<FileSecurityConfig> = {}) {
    this.config = { ...DEFAULT_FILE_SECURITY, ...config };
  }

  /**
   * Validate file upload security
   */
  async validateFileUpload(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File extension validation
    const ext = path.extname(fileName).toLowerCase();
    if (!this.config.allowedExtensions.includes(ext)) {
      errors.push(`File extension '${ext}' is not allowed`);
    }

    // File size validation
    if (fileBuffer.length > this.config.maxFileSize) {
      errors.push(`File size ${fileBuffer.length} exceeds maximum allowed size ${this.config.maxFileSize}`);
    }

    // MIME type validation
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      errors.push(`MIME type '${mimeType}' is not allowed`);
    }

    // File name validation
    if (!this.isValidFileName(fileName)) {
      errors.push('Invalid file name detected');
    }

    // Content validation
    const contentValidation = await this.validateFileContent(fileBuffer, ext);
    if (!contentValidation.valid) {
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
    }

    // Malware scanning (basic implementation)
    if (this.config.scanForMalware) {
      const malwareResult = await this.scanForMalware(fileBuffer);
      if (!malwareResult.clean) {
        errors.push('File failed security scan');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Secure file name validation
   */
  private isValidFileName(fileName: string): boolean {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /\.\./,                    // Directory traversal
      /[<>:"|?*]/,              // Windows invalid chars
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /^\./,                     // Hidden files
      /[\x00-\x1f\x80-\x9f]/,  // Control characters
      /\s$/,                     // Trailing whitespace
      /\.$/                      // Trailing dot
    ];

    return !dangerousPatterns.some(pattern => pattern.test(fileName)) &&
           fileName.length <= 255 &&
           fileName.length > 0;
  }

  /**
   * Validate file content against expected format
   */
  private async validateFileContent(
    buffer: Buffer,
    extension: string
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (extension) {
        case '.jpg':
        case '.jpeg':
          if (!this.isValidJPEG(buffer)) {
            errors.push('Invalid JPEG file format');
          }
          break;

        case '.png':
          if (!this.isValidPNG(buffer)) {
            errors.push('Invalid PNG file format');
          }
          break;

        case '.pdf':
          if (!this.isValidPDF(buffer)) {
            errors.push('Invalid PDF file format');
          }
          break;

        case '.json':
          try {
            JSON.parse(buffer.toString('utf8'));
          } catch {
            errors.push('Invalid JSON format');
          }
          break;

        case '.txt':
          // Check for binary content in text files
          if (this.containsBinaryContent(buffer)) {
            warnings.push('Text file contains binary content');
          }
          break;
      }
    } catch (error) {
      errors.push(`Content validation failed: ${error}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Basic malware scanning (signature-based)
   */
  private async scanForMalware(buffer: Buffer): Promise<{ clean: boolean; threats: string[] }> {
    const threats: string[] = [];

    // Check for common malware signatures
    const malwareSignatures = [
      'MZ',                           // Windows PE executable
      '#!/bin/sh',                    // Shell script
      '#!/bin/bash',                  // Bash script
      '<?php',                        // PHP code
      '<script',                      // JavaScript
      'eval(',                        // Eval function
      'document.write',               // Document write
      'window.location',              // Location redirect
      'XMLHttpRequest',               // AJAX requests
      'ActiveXObject'                 // ActiveX
    ];

    const content = buffer.toString('utf8').toLowerCase();
    
    for (const signature of malwareSignatures) {
      if (content.includes(signature.toLowerCase())) {
        threats.push(`Detected suspicious content: ${signature}`);
      }
    }

    // Check for suspiciously high entropy (packed/encrypted content)
    const entropy = this.calculateEntropy(buffer);
    if (entropy > 7.5) {
      threats.push('High entropy content detected (possibly packed/encrypted)');
    }

    return {
      clean: threats.length === 0,
      threats
    };
  }

  /**
   * File format validation helpers
   */
  private isValidJPEG(buffer: Buffer): boolean {
    return buffer.length >= 2 && 
           buffer[0] === 0xFF && 
           buffer[1] === 0xD8;
  }

  private isValidPNG(buffer: Buffer): boolean {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    return buffer.length >= 8 && 
           buffer.subarray(0, 8).equals(pngSignature);
  }

  private isValidPDF(buffer: Buffer): boolean {
    return buffer.length >= 4 && 
           buffer.subarray(0, 4).toString() === '%PDF';
  }

  private containsBinaryContent(buffer: Buffer): boolean {
    // Check for null bytes or high percentage of non-printable characters
    let nonPrintable = 0;
    for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
      const byte = buffer[i];
      if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
        nonPrintable++;
      }
    }
    return (nonPrintable / Math.min(buffer.length, 1024)) > 0.1;
  }

  private calculateEntropy(buffer: Buffer): number {
    const freq: { [key: number]: number } = {};
    
    // Count byte frequencies
    for (let i = 0; i < buffer.length; i++) {
      freq[buffer[i]] = (freq[buffer[i]] || 0) + 1;
    }

    // Calculate entropy
    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / buffer.length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Secure file operations
   */
  async saveFileSecurely(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ success: boolean; path?: string; errors: string[] }> {
    try {
      // Validate file first
      const validation = await this.validateFileUpload(fileName, fileBuffer, mimeType);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Generate secure file name
      const secureFileName = this.generateSecureFileName(fileName);
      const uploadPath = path.join(this.config.uploadDir, secureFileName);

      // Ensure upload directory exists
      await fs.mkdir(this.config.uploadDir, { recursive: true });

      // Write file with restricted permissions
      await fs.writeFile(uploadPath, fileBuffer, { mode: 0o644 });

      return { 
        success: true, 
        path: uploadPath, 
        errors: [] 
      };

    } catch (error) {
      return { 
        success: false, 
        errors: [`File save failed: ${error}`] 
      };
    }
  }

  /**
   * Generate secure file name to prevent conflicts and attacks
   */
  private generateSecureFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Sanitize base name
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100);
    
    // Add timestamp and random component
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${sanitized}_${timestamp}_${random}${ext}`;
  }

  /**
   * Quarantine suspicious files
   */
  async quarantineFile(filePath: string, reason: string): Promise<boolean> {
    try {
      await fs.mkdir(this.config.quarantineDir, { recursive: true });
      
      const fileName = path.basename(filePath);
      const quarantinePath = path.join(
        this.config.quarantineDir,
        `${Date.now()}_${fileName}`
      );

      await fs.rename(filePath, quarantinePath);
      
      // Log quarantine action
      const logEntry = {
        timestamp: new Date().toISOString(),
        originalPath: filePath,
        quarantinePath,
        reason
      };
      
      const logFile = path.join(this.config.quarantineDir, 'quarantine.log');
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up old files and quarantine
   */
  async cleanupOldFiles(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    
    try {
      // Clean upload directory
      await this.cleanupDirectory(this.config.uploadDir, now, maxAgeMs);
      
      // Clean quarantine directory
      await this.cleanupDirectory(this.config.quarantineDir, now, maxAgeMs);
      
    } catch (error) {
      // Log cleanup errors but don't throw
    }
  }

  private async cleanupDirectory(dirPath: string, now: number, maxAge: number): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && (now - stats.mtimeMs) > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Directory might not exist, ignore
    }
  }
}

// Export singleton instance
export const fileSystemSecurity = new FileSystemSecurity();