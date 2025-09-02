// Local database replacement for MongoDB
import { StudentStorage, EventStorage, MetadataStorage } from './local-storage';

// Define query types
interface RegexQuery {
  $regex: string;
  $options?: string;
}

interface DateQuery {
  $gte?: Date | string;
  $lte?: Date | string;
}

interface QueryValue {
  $regex?: string;
  $options?: string;
  $gte?: Date | string;
  $lte?: Date | string;
}

// User storage (for authentication)
class UserStorage {
  private static users = new Map<string, any>();
  
  static async findUser(username: string): Promise<any | null> {
    return this.users.get(username) || null;
  }
  
  static async createUser(userData: any): Promise<void> {
    this.users.set(userData.username, userData);
  }
  
  // Initialize with admin and staff users
  static initialize() {
    // Clear existing users and reinitialize
    this.users.clear();
    
    // Admin account
    this.users.set('thams.ca@bhc.edu.in', {
      username: 'thams.ca@bhc.edu.in',
      password: '$2a$10$0/3M5830CKiGOOuYWC85Ee75PDye7IXN4RDjSO5Fk9RhQjFzjQvWS', // Azzi@2026
      role: 'admin',
      fullName: 'Administrator'
    });
    
    // Staff account
    this.users.set('staff@bhc.edu.in', {
      username: 'staff@bhc.edu.in',
      password: '$2a$10$bzbw/gY97ACFfdgBVH05EeT16/fbCQMc3.lEWYwFGYcI5xq8FjYQm', // Staff@MCA
      role: 'staff',
      fullName: 'Staff User'
    });
  }
}

// Initialize user storage
UserStorage.initialize();

// Collection interfaces to match MongoDB API
export interface LocalCollection<T> {
  find(query?: any): LocalCursor<T>;
  findOne(query: any): Promise<T | null>;
  insertOne(doc: any): Promise<{ insertedId: string }>;
  updateOne(filter: any, update: any): Promise<{ matchedCount: number; modifiedCount: number }>;
  deleteOne(filter: any): Promise<{ deletedCount: number }>;
  deleteMany(filter: any): Promise<{ deletedCount: number }>;
}

export interface LocalCursor<T> {
  sort(sort: any): LocalCursor<T>;
  limit(limit: number): LocalCursor<T>;
  skip(skip: number): LocalCursor<T>;
  toArray(): Promise<T[]>;
}

// Helper function to check if a document matches a query
function matchesQuery(doc: any, query: any): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (key === '_id') {
      const id = typeof value === 'string' ? value : String(value);
      if (doc.id !== id) return false;
    } else if (key === '$or') {
      const orConditions = value as any[];
      const matchesOr = orConditions.some(condition => {
        for (const [condKey, condValue] of Object.entries(condition)) {
          if (isRegexQuery(condValue)) {
            const regex = new RegExp(condValue.$regex, condValue.$options || '');
            return regex.test(doc[condKey] || '');
          }
          return doc[condKey] === condValue;
        }
        return false;
      });
      if (!matchesOr) return false;
    } else if (key === 'participants') {
      // Handle participant queries
      return doc.participants && doc.participants.includes(value);
    } else if (key === 'eventDate' && isDateQuery(value)) {
      const eventDate = new Date(doc.eventDate);
      if (value.$gte && eventDate < new Date(value.$gte)) return false;
      if (value.$lte && eventDate > new Date(value.$lte)) return false;
    } else if (isRegexQuery(value)) {
      const regex = new RegExp(value.$regex, value.$options || '');
      if (!regex.test(doc[key] || '')) return false;
    } else if (doc[key] !== value) {
      return false;
    }
  }
  return true;
}

function isRegexQuery(value: any): value is RegexQuery {
  return typeof value === 'object' && value && '$regex' in value;
}

function isDateQuery(value: any): value is DateQuery {
  return typeof value === 'object' && value && ('$gte' in value || '$lte' in value);
}

// Student collection implementation
class StudentCollection implements LocalCollection<any> {
  find(query: any = {}): LocalCursor<any> {
    return new StudentCursor(query);
  }

  async findOne(query: any): Promise<any | null> {
    if (query._id) {
      // Handle ObjectId-like queries
      const id = typeof query._id === 'string' ? query._id : String(query._id);
      return await StudentStorage.getStudent(id);
    }
    
    // Handle other queries
    const allStudents = await StudentStorage.getAllStudents();
    return allStudents.find(student => matchesQuery(student, query)) || null;
  }

  async insertOne(doc: any): Promise<{ insertedId: string }> {
    const id = await StudentStorage.saveStudent(doc);
    return { insertedId: id };
  }

  async updateOne(filter: any, update: any): Promise<{ matchedCount: number; modifiedCount: number }> {
    if (filter._id) {
      const id = typeof filter._id === 'string' ? filter._id : String(filter._id);
      const updateData = update.$set || update;
      const success = await StudentStorage.updateStudent(id, updateData);
      return { matchedCount: success ? 1 : 0, modifiedCount: success ? 1 : 0 };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    if (filter._id) {
      const id = typeof filter._id === 'string' ? filter._id : String(filter._id);
      const success = await StudentStorage.deleteStudent(id);
      return { deletedCount: success ? 1 : 0 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    if (filter.batchYear) {
      const allStudents = await StudentStorage.getAllStudents({ batchYear: filter.batchYear });
      let deleted = 0;
      for (const student of allStudents) {
        const success = await StudentStorage.deleteStudent(student.id);
        if (success) deleted++;
      }
      return { deletedCount: deleted };
    }
    return { deletedCount: 0 };
  }
}

class StudentCursor implements LocalCursor<any> {
  private query: any;
  private sortObj: any = {};
  private limitNum: number = 0;
  private skipNum: number = 0;

  constructor(query: any) {
    this.query = query;
  }

  sort(sort: any): LocalCursor<any> {
    this.sortObj = sort;
    return this;
  }

  limit(limit: number): LocalCursor<any> {
    this.limitNum = limit;
    return this;
  }

  skip(skip: number): LocalCursor<any> {
    this.skipNum = skip;
    return this;
  }

  async toArray(): Promise<any[]> {
    let results = await StudentStorage.getAllStudents();
    
    // Apply query filters
    if (this.query && Object.keys(this.query).length > 0) {
      results = results.filter(doc => matchesQuery(doc, this.query));
    }

    // Apply sorting
    if (Object.keys(this.sortObj).length > 0) {
      results.sort((a, b) => {
        for (const [key, order] of Object.entries(this.sortObj)) {
          const aVal = a[key] || '';
          const bVal = b[key] || '';
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (comparison !== 0) {
            return (order as number) === -1 ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply skip and limit
    if (this.skipNum > 0) {
      results = results.slice(this.skipNum);
    }
    if (this.limitNum > 0) {
      results = results.slice(0, this.limitNum);
    }

    return results;
  }
}

// Event collection implementation
class EventCollection implements LocalCollection<any> {
  find(query: any = {}): LocalCursor<any> {
    return new EventCursor(query);
  }

  async findOne(query: any): Promise<any | null> {
    if (query._id) {
      const id = typeof query._id === 'string' ? query._id : String(query._id);
      return await EventStorage.getEvent(id);
    }
    
    const allEvents = await EventStorage.getAllEvents();
    return allEvents.find(event => matchesQuery(event, query)) || null;
  }

  async insertOne(doc: any): Promise<{ insertedId: string }> {
    const id = await EventStorage.saveEvent(doc);
    return { insertedId: id };
  }

  async updateOne(filter: any, update: any): Promise<{ matchedCount: number; modifiedCount: number }> {
    if (filter._id) {
      const id = typeof filter._id === 'string' ? filter._id : String(filter._id);
      const updateData = update.$set || update;
      const success = await EventStorage.updateEvent(id, updateData);
      return { matchedCount: success ? 1 : 0, modifiedCount: success ? 1 : 0 };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    if (filter._id) {
      const id = typeof filter._id === 'string' ? filter._id : String(filter._id);
      const success = await EventStorage.deleteEvent(id);
      return { deletedCount: success ? 1 : 0 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    // Implement bulk delete if needed
    return { deletedCount: 0 };
  }
}

class EventCursor implements LocalCursor<any> {
  private query: any;
  private sortObj: any = {};
  private limitNum: number = 0;
  private skipNum: number = 0;

  constructor(query: any) {
    this.query = query;
  }

  sort(sort: any): LocalCursor<any> {
    this.sortObj = sort;
    return this;
  }

  limit(limit: number): LocalCursor<any> {
    this.limitNum = limit;
    return this;
  }

  skip(skip: number): LocalCursor<any> {
    this.skipNum = skip;
    return this;
  }

  async toArray(): Promise<any[]> {
    let results = await EventStorage.getAllEvents();
    
    // Apply query filters
    if (this.query && Object.keys(this.query).length > 0) {
      results = results.filter(doc => matchesQuery(doc, this.query));
    }

    // Apply sorting
    if (Object.keys(this.sortObj).length > 0) {
      results.sort((a, b) => {
        for (const [key, order] of Object.entries(this.sortObj)) {
          let aVal = a[key] || '';
          let bVal = b[key] || '';
          
          // Handle date sorting
          if (key === 'eventDate') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }
          
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (comparison !== 0) {
            return (order as number) === -1 ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply skip and limit
    if (this.skipNum > 0) {
      results = results.slice(this.skipNum);
    }
    if (this.limitNum > 0) {
      results = results.slice(0, this.limitNum);
    }

    return results;
  }
}

// Main database interface
export class LocalDatabase {
  static async getStudents(): Promise<LocalCollection<any>> {
    return new StudentCollection();
  }

  static async getEvents(): Promise<LocalCollection<any>> {
    return new EventCollection();
  }

  static async getUsers() {
    return UserStorage;
  }

  static async getWinners(): Promise<LocalCollection<any>> {
    // For now, winners can be stored as metadata
    return new EventCollection(); // Can extend this later
  }
}

// Export collection getters to match existing API
export const getStudents = () => LocalDatabase.getStudents();
export const getEvents = () => LocalDatabase.getEvents();
export const getUsers = () => LocalDatabase.getUsers();
export const getWinners = () => LocalDatabase.getWinners();