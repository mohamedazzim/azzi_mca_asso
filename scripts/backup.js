#!/usr/bin/env node
/**
 * Backup Script
 * Creates compressed backups of storage directory and data
 */

const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { createGzip } = require('zlib');

const STORAGE_BASE = process.env.STORAGE_BASE_PATH || './storage';
const BACKUP_DIR = path.join(STORAGE_BASE, 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

async function createBackup(description = 'Manual backup') {
  try {
    console.log('🔄 Starting backup process...');
    
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.zip`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    console.log(`📦 Creating backup: ${backupName}`);
    
    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      description,
      includedPaths: [],
      configFiles: []
    };
    
    // Create tar-like structure manually since we don't have archiver
    const backupData = {
      metadata,
      storage: null,
      data: null,
      config: {}
    };
    
    // Backup storage directory
    if (await directoryExists(STORAGE_BASE)) {
      backupData.storage = await backupDirectory(STORAGE_BASE);
      metadata.includedPaths.push('storage');
      console.log('📂 Added storage directory to backup');
    }
    
    // Backup data directory
    if (await directoryExists(DATA_DIR)) {
      backupData.data = await backupDirectory(DATA_DIR);
      metadata.includedPaths.push('data');
      console.log('📂 Added data directory to backup');
    }
    
    // Backup configuration files
    const configFiles = ['package.json', 'next.config.mjs', 'tsconfig.json'];
    for (const file of configFiles) {
      const filePath = path.join(process.cwd(), file);
      if (await fileExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        backupData.config[file] = content;
        metadata.configFiles.push(file);
        console.log(`📄 Added ${file} to backup`);
      }
    }
    
    // Write backup file
    const backupContent = JSON.stringify(backupData, null, 2);
    await fs.writeFile(backupPath, backupContent);
    
    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupPath}`);
    console.log(`📊 Backup size: ${Buffer.byteLength(backupContent)} bytes`);
    
    // Clean up old backups (keep last 10)
    await cleanupOldBackups();
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

async function backupDirectory(dirPath) {
  const result = {};
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        result[item.name] = await backupDirectory(itemPath);
      } else if (item.isFile()) {
        try {
          // For JSON files, parse content; for others, read as base64
          if (item.name.endsWith('.json')) {
            const content = await fs.readFile(itemPath, 'utf8');
            result[item.name] = JSON.parse(content);
          } else {
            const content = await fs.readFile(itemPath);
            result[item.name] = {
              type: 'file',
              data: content.toString('base64'),
              originalPath: itemPath
            };
          }
        } catch (error) {
          console.warn(`⚠️ Could not backup file ${itemPath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not access directory ${dirPath}:`, error.message);
  }
  
  return result;
}

async function cleanupOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.zip'))
      .map(file => ({ name: file, path: path.join(BACKUP_DIR, file) }))
      .sort((a, b) => b.name.localeCompare(a.name)); // Sort by name (newest first)
    
    if (backupFiles.length > 10) {
      console.log('🧹 Cleaning up old backups (keeping 10 most recent)...');
      const filesToDelete = backupFiles.slice(10);
      
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Warning: Could not clean up old backups:', error.message);
  }
}

async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Run backup if called directly
if (require.main === module) {
  const description = process.argv[2] || 'Manual backup';
  createBackup(description)
    .then(backupPath => {
      console.log('🎉 Backup process completed successfully!');
      console.log(`💾 Backup location: ${backupPath}`);
    })
    .catch(error => {
      console.error('💥 Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup, cleanupOldBackups };