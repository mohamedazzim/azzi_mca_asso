# Overview

The College Management System is a comprehensive web application designed for managing students, events, analytics, and activities within an MCA department. The system provides a modern, production-ready platform with role-based access control, photo management, event tracking, and detailed analytics reporting. Built with Next.js 14, TypeScript, and local file storage, it offers features like bulk PDF import for student data, event management with participant tracking, comprehensive analytics dashboards, and secure user authentication. Now fully configured for Replit environment with proper host bindings and deployment settings.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with TypeScript and React Server Components (RSC)
- **UI Components**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: React hooks and local state management with custom hooks for session handling
- **Authentication**: Client-side authentication with localStorage and session timeout management
- **Routing**: Next.js App Router with middleware-based route protection and role-based access control
- **Responsive Design**: Mobile-first responsive design with custom breakpoints and accessibility features

## Backend Architecture
- **API Routes**: Next.js API routes handling RESTful endpoints for students, events, analytics, and authentication
- **Database Layer**: MongoDB integration with custom database models and connection management
- **Authentication**: Session-based authentication with bcryptjs password hashing and role-based authorization
- **File Processing**: PDF parsing with OCR capabilities using pdf-parse and canvas libraries for bulk student import
- **Image Processing**: Photo upload and management with validation and secure storage

## Data Storage Solutions
- **Primary Database**: Local JSON files for all application data including users, students, events, and analytics
- **Photo Storage**: Local file system storage in organized folder structure by batch/event
- **Session Storage**: Browser localStorage for user session management with automatic timeout
- **File Upload**: Local file processing and storage with organized directory structure

## Authentication and Authorization
- **Authentication Method**: Username/password authentication with bcryptjs hashing
- **Session Management**: Custom session handling with automatic timeout after 30 minutes of inactivity
- **Role-Based Access**: Two-tier role system (admin/staff) with middleware enforcement
- **Route Protection**: Comprehensive middleware protecting all admin routes with redirect logic
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, and other security headers

## External Dependencies
- **UI Framework**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Charts**: Recharts library for analytics visualization
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation resolvers
- **Date Handling**: date-fns library for date manipulation and formatting
- **Development Tools**: ESLint with Next.js and TypeScript configurations

# Recent Changes

## Local Storage Implementation Update (September 2025)

### Overview
Completely migrated the application from MongoDB/Cloudinary dependencies to a robust local file storage system optimized for the Replit environment.

### Storage Architecture Changes

#### Student Data Storage
- **Location**: `data/students/batches/<batch_year>/`
- **Structure**: 
  - Student metadata: `<student_id>.json`
  - Student photos: `<roll_number>.<ext>` (jpg, png, webp supported)
- **Features**:
  - Automatic batch folder creation
  - Roll number-based photo naming for easy identification
  - Proper photo cleanup on student deletion
  - Batch-organized storage for scalability

#### Event Data Storage
- **Location**: `data/events/`
- **Structure**:
  - Event metadata: `event-files/<event_id>.json`
  - Event media: `media/<event_id>/` (photos, reports, attendance sheets)
- **Features**:
  - Dedicated folder per event for all related files
  - Timestamped file naming to prevent conflicts
  - Complete cleanup on event deletion including all associated media

#### System Improvements
- **Error Handling**: Added comprehensive error handling with graceful fallbacks
- **Validation**: Server-side validation for required fields and data integrity
- **File Safety**: Sanitized filenames and secure file operations
- **Dashboard Refresh**: Automatic data refresh every 30 seconds to reflect latest changes

### API Enhancements
- Updated analytics API to work with local storage collections
- Fixed photo serving with proper fallbacks to default avatars
- Improved error responses with detailed messaging
- Cache-busting headers for real-time data updates

### Technical Details
- **Storage Base Path**: Configurable via `STORAGE_BASE` environment variable
- **File Organization**: Hierarchical structure for easy backup and migration
- **Photo Handling**: Direct file system storage with optimized serving
- **Data Consistency**: Atomic operations with proper transaction-like behavior

### Benefits
- ✅ No external dependencies (MongoDB, Cloudinary)
- ✅ Full data ownership and control
- ✅ Faster local file access
- ✅ Simplified deployment and backup
- ✅ Cost-effective solution
- ✅ Replit environment optimized