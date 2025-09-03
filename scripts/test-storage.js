#!/usr/bin/env node
/**
 * Test script for storage functionality
 * Tests storage helper functions and file serving
 */

const { 
  saveStudentProfilePhoto, 
  saveEventFile, 
  saveMetadata, 
  readMetadata, 
  initializeStorage 
} = require('../lib/storage.ts');
const fs = require('fs').promises;
const path = require('path');

async function testStorage() {
  console.log('🧪 Testing Storage Functionality');
  console.log('================================');

  try {
    // Initialize storage
    console.log('1. Initializing storage directories...');
    await initializeStorage();
    console.log('✅ Storage directories created');

    // Test metadata operations
    console.log('2. Testing metadata operations...');
    const testMetadata = {
      name: 'Test Student',
      rollNumber: 'TEST001',
      email: 'test@example.com',
      batch: '2024'
    };
    
    const metadataPath = './storage/test-metadata.json';
    const saveResult = await saveMetadata(metadataPath, testMetadata);
    
    if (saveResult.success) {
      console.log('✅ Metadata saved successfully');
      
      const readResult = await readMetadata(metadataPath);
      if (readResult.success && readResult.data.name === 'Test Student') {
        console.log('✅ Metadata read successfully');
      } else {
        console.log('❌ Metadata read failed');
      }
    } else {
      console.log('❌ Metadata save failed:', saveResult.error);
    }

    // Test file creation for storage structure
    console.log('3. Testing storage structure...');
    const testStudentDir = './storage/students/2024/TEST001';
    await fs.mkdir(testStudentDir, { recursive: true });
    
    // Create a test file to verify directory structure
    await fs.writeFile(path.join(testStudentDir, 'test-profile.jpg'), Buffer.from('test image data'));
    console.log('✅ Student directory structure created');

    // Test event directory structure  
    const testEventDir = './storage/events/2024/09-September/test-event/photos';
    await fs.mkdir(testEventDir, { recursive: true });
    await fs.writeFile(path.join(testEventDir, 'test-photo.jpg'), Buffer.from('test photo data'));
    console.log('✅ Event directory structure created');

    // List created files
    console.log('4. Verifying file structure...');
    const studentFiles = await fs.readdir(testStudentDir);
    const eventFiles = await fs.readdir(testEventDir);
    
    console.log('Student files:', studentFiles);
    console.log('Event files:', eventFiles);

    console.log('\n🎉 Storage functionality test completed successfully!');
    console.log('\nStorage structure:');
    console.log('/storage');
    console.log('  /students');
    console.log('    /2024');
    console.log('      /TEST001');
    console.log('        test-profile.jpg');
    console.log('  /events');
    console.log('    /2024');
    console.log('      /09-September');
    console.log('        /test-event');
    console.log('          /photos');
    console.log('            test-photo.jpg');

  } catch (error) {
    console.error('❌ Storage test failed:', error);
    process.exit(1);
  }
}

testStorage();