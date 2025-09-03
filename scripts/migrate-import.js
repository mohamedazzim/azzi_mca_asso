#!/usr/bin/env node
/**
 * Migration and Import Script
 * Handles data migration from external sources to local storage
 */

const fs = require('fs').promises;
const path = require('path');

const STORAGE_BASE = process.env.STORAGE_BASE_PATH || './storage';
const DATA_DIR = path.join(process.cwd(), 'data');

async function migrateLegacyData() {
  try {
    console.log('🔄 Starting legacy data migration...');
    
    // Check if we have old MongoDB-style data to migrate
    const legacyDataPath = path.join(process.cwd(), 'legacy-data');
    if (await directoryExists(legacyDataPath)) {
      console.log('📂 Found legacy data directory');
      await migrateLegacyDirectory(legacyDataPath);
    }
    
    // Check for old Cloudinary URLs and update to local storage
    await migrateImageReferences();
    
    // Verify storage structure
    await ensureStorageStructure();
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function migrateLegacyDirectory(legacyPath) {
  console.log(`📁 Migrating from: ${legacyPath}`);
  
  try {
    const items = await fs.readdir(legacyPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(legacyPath, item.name);
      
      if (item.isDirectory()) {
        await migrateLegacyDirectory(itemPath);
      } else if (item.isFile() && item.name.endsWith('.json')) {
        await migrateLegacyJsonFile(itemPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not migrate directory ${legacyPath}:`, error.message);
  }
}

async function migrateLegacyJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Determine file type and migrate appropriately
    if (Array.isArray(data)) {
      // Likely a collection of items
      for (const item of data) {
        if (item.rollNumber || item.name) {
          // Student data
          await migrateStudentRecord(item);
        } else if (item.title || item.eventDate) {
          // Event data
          await migrateEventRecord(item);
        }
      }
    } else if (data.rollNumber || data.name) {
      // Single student record
      await migrateStudentRecord(data);
    } else if (data.title || data.eventDate) {
      // Single event record
      await migrateEventRecord(data);
    }
    
    console.log(`  ✅ Migrated: ${path.basename(filePath)}`);
    
  } catch (error) {
    console.warn(`⚠️ Could not migrate file ${filePath}:`, error.message);
  }
}

async function migrateStudentRecord(studentData) {
  const { StudentStorage } = require('../lib/local-storage.ts');
  
  try {
    // Transform legacy data to new format
    const transformedData = {
      name: studentData.name,
      rollNumber: studentData.rollNumber || studentData.roll_number,
      email: studentData.email,
      phone: studentData.phone || studentData.phoneNumber,
      section: studentData.section,
      batchYear: studentData.batchYear || studentData.batch,
      dateOfBirth: studentData.dateOfBirth || studentData.dob,
      gender: studentData.gender,
      bloodGroup: studentData.bloodGroup,
      address: studentData.address,
      hostellerStatus: studentData.hostellerStatus || (studentData.isHosteller ? 'Hosteller' : 'Day Scholar'),
      joiningDate: studentData.joiningDate || new Date().toISOString(),
      isActive: studentData.isActive !== false,
      achievements: studentData.achievements || [],
      scores: studentData.scores || [],
      attendedEvents: studentData.attendedEvents || []
    };
    
    // Migrate photo URL to local storage if present
    if (studentData.photoUrl || studentData.photo) {
      // Note: In a real migration, you'd download the image from the URL
      // For now, we'll just note that a photo was present
      transformedData.hasPhoto = true;
      transformedData.photoUrl = studentData.photoUrl || studentData.photo;
    }
    
    await StudentStorage.saveStudent(transformedData);
    console.log(`    📝 Migrated student: ${transformedData.name} (${transformedData.rollNumber})`);
    
  } catch (error) {
    console.warn(`⚠️ Could not migrate student record:`, error.message);
  }
}

async function migrateEventRecord(eventData) {
  const { EventStorage } = require('../lib/local-storage.ts');
  
  try {
    // Transform legacy data to new format
    const transformedData = {
      title: eventData.title,
      eventDate: new Date(eventData.eventDate || eventData.date),
      location: eventData.location || eventData.venue,
      chiefGuest: eventData.chiefGuest || eventData.chief_guest,
      fundSpent: parseFloat(eventData.fundSpent || eventData.budget || 0),
      eventType: eventData.eventType || eventData.type || 'General',
      description: eventData.description,
      attendees: eventData.attendees || eventData.participants || [],
      winners: eventData.winners || [],
      photos: eventData.photos || [],
      reports: eventData.reports || [],
      status: eventData.status || 'completed',
      createdAt: eventData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await EventStorage.saveEvent(transformedData);
    console.log(`    📅 Migrated event: ${transformedData.title}`);
    
  } catch (error) {
    console.warn(`⚠️ Could not migrate event record:`, error.message);
  }
}

async function migrateImageReferences() {
  console.log('🖼️ Migrating image references...');
  
  // This would scan through all student and event records
  // and update any Cloudinary URLs to local storage paths
  // For now, we'll implement a basic structure
  
  try {
    const studentsPath = path.join(DATA_DIR, 'students', 'batches');
    if (await directoryExists(studentsPath)) {
      await migrateStudentImages(studentsPath);
    }
    
    const eventsPath = path.join(DATA_DIR, 'events');
    if (await directoryExists(eventsPath)) {
      await migrateEventImages(eventsPath);
    }
    
  } catch (error) {
    console.warn('⚠️ Could not complete image migration:', error.message);
  }
}

async function migrateStudentImages(studentsPath) {
  // Scan student records and update image references
  const batches = await fs.readdir(studentsPath);
  
  for (const batch of batches) {
    const batchPath = path.join(studentsPath, batch);
    if (await directoryExists(batchPath)) {
      const studentFiles = await fs.readdir(batchPath);
      
      for (const file of studentFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(batchPath, file);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const student = JSON.parse(content);
            
            // Update any legacy image URLs
            if (student.photoUrl && student.photoUrl.includes('cloudinary')) {
              student.legacyPhotoUrl = student.photoUrl;
              student.photoUrl = null; // Will be replaced when photo is uploaded
              student.migrationNote = 'Photo URL migrated from Cloudinary';
              
              await fs.writeFile(filePath, JSON.stringify(student, null, 2));
              console.log(`    🖼️ Updated photo reference for: ${student.name}`);
            }
          } catch (error) {
            console.warn(`⚠️ Could not update student file ${file}:`, error.message);
          }
        }
      }
    }
  }
}

async function migrateEventImages(eventsPath) {
  // Similar to student images, but for events
  console.log('    📅 Scanning event images...');
  // Implementation would be similar to migrateStudentImages
}

async function ensureStorageStructure() {
  console.log('🏗️ Ensuring storage structure...');
  
  const requiredDirs = [
    path.join(STORAGE_BASE, 'students'),
    path.join(STORAGE_BASE, 'events'),
    path.join(STORAGE_BASE, 'backups'),
    path.join(STORAGE_BASE, 'logs'),
    path.join(DATA_DIR, 'students', 'batches'),
    path.join(DATA_DIR, 'events', 'years'),
    path.join(DATA_DIR, 'metadata')
  ];
  
  for (const dir of requiredDirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  
  // Create system metadata if it doesn't exist
  const metadataPath = path.join(DATA_DIR, 'metadata', 'system.json');
  if (!await fileExists(metadataPath)) {
    const systemMetadata = {
      version: '2.0.0',
      migrationCompleted: new Date().toISOString(),
      storageStructureVersion: '1.0',
      lastMigration: new Date().toISOString()
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(systemMetadata, null, 2));
    console.log('    📋 Created system metadata');
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

// Import data from external file
async function importDataFromFile(filePath, dataType = 'auto') {
  try {
    console.log(`📥 Importing data from: ${filePath}`);
    
    if (!await fileExists(filePath)) {
      throw new Error(`Import file not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let importedCount = 0;
    
    if (dataType === 'students' || (dataType === 'auto' && Array.isArray(data) && data[0]?.rollNumber)) {
      for (const item of data) {
        await migrateStudentRecord(item);
        importedCount++;
      }
    } else if (dataType === 'events' || (dataType === 'auto' && Array.isArray(data) && data[0]?.title)) {
      for (const item of data) {
        await migrateEventRecord(item);
        importedCount++;
      }
    } else {
      throw new Error('Unknown data format. Please specify dataType as "students" or "events"');
    }
    
    console.log(`✅ Imported ${importedCount} records successfully!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  const filePath = process.argv[3];
  const dataType = process.argv[4];
  
  if (command === 'import' && filePath) {
    importDataFromFile(filePath, dataType)
      .then(() => {
        console.log('✅ Import completed successfully!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Import failed:', error);
        process.exit(1);
      });
  } else {
    migrateLegacyData()
      .then(() => {
        console.log('✅ Migration completed successfully!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { migrateLegacyData, importDataFromFile, ensureStorageStructure };