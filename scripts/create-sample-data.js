// Sample data creation script for local storage testing
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Ensure data directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const dataDir = path.join(process.cwd(), 'data');
const studentsDir = path.join(dataDir, 'students');
const eventsDir = path.join(dataDir, 'events');
const metadataDir = path.join(dataDir, 'metadata');

// Create directories
[
  dataDir,
  studentsDir,
  eventsDir,
  metadataDir,
  path.join(studentsDir, 'batches'),
  path.join(studentsDir, 'photos'),
  path.join(studentsDir, 'profiles'),
  path.join(eventsDir, 'event-files'),
  path.join(eventsDir, 'photos'),
  path.join(eventsDir, 'reports'),
  path.join(eventsDir, 'attendance')
].forEach(ensureDir);

// Sample students data
const sampleStudents = [
  {
    name: "Alice Johnson",
    rollNumber: "MCA2023001",
    email: "alice.johnson@example.com",
    phone: "9876543210",
    batch: "2023",
    batchYear: "2023",
    section: "A",
    gender: "Female",
    dateOfBirth: new Date("2001-05-15"),
    isActive: true,
  },
  {
    name: "Bob Smith",
    rollNumber: "MCA2023002", 
    email: "bob.smith@example.com",
    phone: "9876543211",
    batch: "2023",
    batchYear: "2023",
    section: "A",
    gender: "Male",
    dateOfBirth: new Date("2000-08-22"),
    isActive: true,
  },
  {
    name: "Charlie Brown",
    rollNumber: "MCA2022001",
    email: "charlie.brown@example.com",
    phone: "9876543212",
    batch: "2022",
    batchYear: "2022", 
    section: "B",
    gender: "Male",
    dateOfBirth: new Date("1999-12-10"),
    isActive: true,
  },
  {
    name: "Diana Prince",
    rollNumber: "MCA2022002",
    email: "diana.prince@example.com",
    phone: "9876543213",
    batch: "2022",
    batchYear: "2022",
    section: "A", 
    gender: "Female",
    dateOfBirth: new Date("2000-03-25"),
    isActive: true,
  },
  {
    name: "Eve Adams",
    rollNumber: "MCA2024001",
    email: "eve.adams@example.com",
    phone: "9876543214",
    batch: "2024",
    batchYear: "2024",
    section: "A",
    gender: "Female", 
    dateOfBirth: new Date("2002-01-18"),
    isActive: true,
  }
];

// Sample events data
const sampleEvents = [
  {
    title: "Annual Tech Fest 2024",
    eventDate: new Date("2024-10-15"),
    location: "Main Auditorium",
    chiefGuest: "Dr. Sarah Tech",
    fundSpent: 25000,
    description: "Annual technology festival featuring competitions, workshops, and exhibitions.",
    eventType: "Festival",
    status: "completed",
    isCompetition: true,
    participants: []
  },
  {
    title: "Programming Workshop",
    eventDate: new Date("2024-11-20"),
    location: "Computer Lab 1",
    chiefGuest: "Prof. John Code",
    fundSpent: 5000,
    description: "Hands-on programming workshop covering latest technologies.",
    eventType: "Workshop", 
    status: "completed",
    isCompetition: false,
    participants: []
  },
  {
    title: "Cultural Evening",
    eventDate: new Date("2025-02-14"),
    location: "College Ground",
    chiefGuest: "Ms. Art Director",
    fundSpent: 15000,
    description: "Cultural program featuring music, dance, and drama performances.",
    eventType: "Cultural",
    status: "upcoming",
    isCompetition: false,
    participants: []
  },
  {
    title: "Coding Competition",
    eventDate: new Date("2025-03-10"),
    location: "Computer Lab 2",
    chiefGuest: "CEO Tech Solutions",
    fundSpent: 10000,
    description: "Inter-college coding competition with prizes for winners.",
    eventType: "Competition",
    status: "upcoming", 
    isCompetition: true,
    participants: []
  },
  {
    title: "Alumni Meet 2025",
    eventDate: new Date("2025-04-25"),
    location: "Conference Hall",
    chiefGuest: "Distinguished Alumni",
    fundSpent: 20000,
    description: "Annual alumni gathering and networking event.",
    eventType: "Networking",
    status: "upcoming",
    isCompetition: false,
    participants: []
  }
];

console.log('Creating sample data...');

// Create student records
sampleStudents.forEach((studentData, index) => {
  const id = randomUUID();
  const batchDir = path.join(studentsDir, 'batches', studentData.batchYear);
  ensureDir(batchDir);
  
  const studentRecord = {
    ...studentData,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const filePath = path.join(batchDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(studentRecord, null, 2));
  console.log(`Created student: ${studentData.name} (${studentData.rollNumber})`);
});

// Create event records  
sampleEvents.forEach((eventData, index) => {
  const id = randomUUID();
  const eventRecord = {
    ...eventData,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const filePath = path.join(eventsDir, 'event-files', `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(eventRecord, null, 2));
  console.log(`Created event: ${eventData.title}`);
});

// Create metadata files
const metadata = {
  systemInfo: {
    version: "1.0.0",
    migratedFrom: "MongoDB + Cloudinary",
    migratedAt: new Date().toISOString(),
    totalStudents: sampleStudents.length,
    totalEvents: sampleEvents.length
  }
};

fs.writeFileSync(
  path.join(metadataDir, 'system.json'), 
  JSON.stringify(metadata, null, 2)
);

console.log('\n✅ Sample data created successfully!');
console.log(`📁 Data directory: ${dataDir}`);
console.log(`👥 Students: ${sampleStudents.length}`);
console.log(`🎉 Events: ${sampleEvents.length}`);
console.log('\n🚀 Your local storage system is ready to use!');