import clientPromise from './mongodb'
import { ObjectId } from "mongodb"

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
  _id?: string | ObjectId
  name: string
  rollNumber: string
  email: string
  phone: string
  batch: string
  section?: string
  class?: string // Added for compatibility
  category?: string // Added for compatibility
  gender: string
  dateOfBirth: Date
  photoUrl?: string
  photoData?: Buffer
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
  participations?: Array<{ eventId: string | ObjectId, eventTitle: string, date: Date, award?: string, position?: number }>
}

export interface Event {
  _id?: ObjectId | string
  title: string
  eventDate: Date
  location: string
  chiefGuest?: string
  fundSpent: number
  description?: string
  eventType?: string
  attendanceSheetUrl?: string
  reportUrl?: string // Added for uploaded event report
  photoUrls?: string[] // Added for uploaded event photos
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  isCompetition?: boolean // Added for competition events
  createdAt: Date
  updatedAt: Date
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

// Database operations
export async function getUsers() {
  const client = await clientPromise
  const db = client.db('college_management')
  return db.collection<User>('users')
}

export async function getStudents() {
  const client = await clientPromise
  const db = client.db('college_management')
  return db.collection<Student>('students')
}

export async function getEvents() {
  const client = await clientPromise
  const db = client.db('college_management')
  return db.collection<Event>('events')
}

export async function getEventParticipations() {
  const client = await clientPromise
  const db = client.db('college_management')
  return db.collection<EventParticipation>('event_participations')
}

export async function getWinners() {
  const client = await clientPromise
  const db = client.db('college_management')
  return db.collection<Winner>('winners')
} 