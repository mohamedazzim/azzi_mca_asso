#!/usr/bin/env node
/**
 * Restore Script
 * Restores data from backup files
 */

const fs = require('fs').promises;
const path = require('path');

const STORAGE_BASE = process.env.STORAGE_BASE_PATH || './storage';
const BACKUP_DIR = path.join(STORAGE_BASE, 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

async function listAvailableBackups() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.zip'))
      .sort((a, b) => b.localeCompare(a)); // Newest first
    
    return backupFiles.map(file => path.join(BACKUP_DIR, file));
  } catch (error) {
    console.error('❌ Could not list backups:', error.message);
    return [];
  }
}

async function restoreFromBackup(backupPath, options = {}) {
  try {
    console.log(`🔄 Starting restore from: ${path.basename(backupPath)}`);
    
    // Verify backup file exists
    if (!await fileExists(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Read and parse backup
    const backupContent = await fs.readFile(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    console.log('📋 Backup metadata:');
    console.log(`  - Created: ${new Date(backupData.metadata.timestamp).toLocaleString()}`);
    console.log(`  - Version: ${backupData.metadata.version}`);
    console.log(`  - Description: ${backupData.metadata.description}`);
    
    // Create restore point before proceeding
    if (!options.skipBackup) {
      console.log('💾 Creating restore point...');
      const { createBackup } = require('./backup.js');
      await createBackup('Pre-restore backup');
    }
    
    let restoredItems = 0;
    
    // Restore storage directory
    if (backupData.storage && (options.restoreStorage !== false)) {
      console.log('📂 Restoring storage directory...');
      await restoreDirectory(backupData.storage, STORAGE_BASE);
      restoredItems++;
    }
    
    // Restore data directory
    if (backupData.data && (options.restoreData !== false)) {
      console.log('📂 Restoring data directory...');
      await restoreDirectory(backupData.data, DATA_DIR);
      restoredItems++;
    }
    
    // Restore configuration files
    if (backupData.config && (options.restoreConfig !== false)) {
      console.log('📄 Restoring configuration files...');
      for (const [filename, content] of Object.entries(backupData.config)) {
        const filePath = path.join(process.cwd(), filename);
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Restored: ${filename}`);
        restoredItems++;
      }
    }
    
    console.log(`🎉 Restore completed successfully! (${restoredItems} items restored)`);
    console.log('⚠️  Please restart the application to apply changes.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

async function restoreDirectory(backupData, targetPath) {
  // Ensure target directory exists
  await fs.mkdir(targetPath, { recursive: true });
  
  for (const [name, content] of Object.entries(backupData)) {
    const itemPath = path.join(targetPath, name);
    
    if (typeof content === 'object' && content.type === 'file') {
      // Restore binary file from base64
      const buffer = Buffer.from(content.data, 'base64');
      await fs.writeFile(itemPath, buffer);
      console.log(`  📄 Restored file: ${name}`);
    } else if (typeof content === 'object' && !content.type) {
      // Restore directory recursively
      await fs.mkdir(itemPath, { recursive: true });
      await restoreDirectory(content, itemPath);
      console.log(`  📁 Restored directory: ${name}`);
    } else {
      // Restore JSON file
      await fs.writeFile(itemPath, JSON.stringify(content, null, 2));
      console.log(`  📄 Restored JSON: ${name}`);
    }
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

async function interactiveRestore() {
  console.log('🔍 Searching for available backups...');
  const backups = await listAvailableBackups();
  
  if (backups.length === 0) {
    console.log('❌ No backups found.');
    return;
  }
  
  console.log('\n📋 Available backups:');
  backups.forEach((backup, index) => {
    const name = path.basename(backup);
    const timestamp = name.replace('backup-', '').replace('.zip', '').replace(/-/g, ':');
    console.log(`  ${index + 1}. ${name} (${timestamp})`);
  });
  
  // For non-interactive environments, restore the latest backup
  const latestBackup = backups[0];
  console.log(`\n🔄 Restoring latest backup: ${path.basename(latestBackup)}`);
  
  await restoreFromBackup(latestBackup);
}

// Run restore if called directly
if (require.main === module) {
  const backupPath = process.argv[2];
  
  if (backupPath) {
    // Restore specific backup
    const fullPath = path.isAbsolute(backupPath) 
      ? backupPath 
      : path.join(BACKUP_DIR, backupPath);
    
    restoreFromBackup(fullPath)
      .then(() => {
        console.log('✅ Restore completed successfully!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Restore failed:', error);
        process.exit(1);
      });
  } else {
    // Interactive restore
    interactiveRestore()
      .then(() => {
        console.log('✅ Interactive restore completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Interactive restore failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { restoreFromBackup, listAvailableBackups };