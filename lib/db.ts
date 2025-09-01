// Local database replacement - no longer using MongoDB
import { getStudents, getEvents, getUsers, getWinners } from "./local-db"

// Keep interfaces for type compatibility
export interface User {
  _id?: string
  username: string
  passwordHash: string
  role: 'admin' | 'staff'
  fullName?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  _id?: string
  id?: string  // For local storage compatibility
  name: string
  rollNumber: string
  email: string
  phone: string
  batch: string
  batchYear?: string  // For local storage organization
  section?: string
  class?: string // Added for compatibility
  category?: string // Added for compatibility
  gender: string
  dateOfBirth: Date
  photoUrl?: string
  photoData?: Buffer
  photoPath?: string  // For local file storage
  photoContentType?: string
  photoFileName?: string
  address?: string
  guardianName?: string
  guardianPhone?: string
  bloodGroup?: string
  hostellerStatus?: string // Added
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  participations?: Array<{ eventId: string, eventTitle: string, date: Date, award?: string, position?: number }>
}

export interface Event {
  _id?: string
  id?: string  // For local storage compatibility
  title: string
  eventDate: Date
  location: string
  chiefGuest?: string
  fundSpent: number
  description?: string
  eventType?: string
  attendanceSheetUrl?: string
  attendanceSheetPath?: string  // For local file storage
  reportUrl?: string // Added for uploaded event report
  reportPath?: string  // For local file storage
  photoUrls?: string[] // Added for uploaded event photos
  photoPaths?: string[]  // For local file storage
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  isCompetition?: boolean // Added for competition events
  createdAt: Date
  updatedAt: Date
  participants?: string[]  // Array of student IDs
}

export interface EventParticipation {
  _id?: string
  eventId: string
  studentId: string
  attendanceStatus: 'present' | 'absent' | 'late'
  attendanceMarkedAt: Date
  attendanceMarkedBy?: string
  notes?: string
  createdAt: Date
}

export interface Winner {
  _id?: string
  eventId: string
  studentId: string
  awardTitle: string
  position?: number
  category?: string
  prizeAmount?: number
  certificateUrl?: string
  resultDescription?: string
  createdAt: Date
}

// Export the local storage collection getters
export { getUsers, getStudents, getEvents, getWinners };

// Create a placeholder for event participations (can be added later if needed)
export async function getEventParticipations() {
  // For now, return the events collection as participations can be stored as part of events
  return getEvents();
}