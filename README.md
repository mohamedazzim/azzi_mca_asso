# MCA Department College Management System

A comprehensive, modern web application designed for managing students, events, analytics, and activities within the MCA Department. Built with Next.js 14, TypeScript, and local data storage, this production-ready platform provides secure role-based access control, advanced analytics, and intuitive user interfaces.

---

## ✨ Key Features

### 🎓 **Student Management**
- Complete CRUD operations for student records
- Bulk PDF import with OCR support for student data extraction
- Photo upload and management with validation
- Advanced search and filtering by batch, section, and class
- Bulk operations for efficient data management
- Responsive student profiles with detailed information

### 📅 **Event Management**
- Create, edit, and manage department events and competitions
- Participant tracking and attendance management
- Winner selection and award tracking
- Event photo and file management
- Comprehensive event analytics and reporting
- Status tracking (upcoming, ongoing, completed)

### 📊 **Analytics & Reporting**
- Real-time dashboard with key performance indicators
- Date range filtering for custom analytics
- Student performance tracking and top performer identification
- Event participation statistics
- Budget and fund utilization tracking
- Interactive charts and data visualizations

### 🔐 **Security & Authentication**
- Role-based access control (Admin/Staff permissions)
- Secure session management with automatic timeout
- Server-side route protection with middleware
- Password hashing using bcrypt
- CSRF protection and security headers
- Input validation and sanitization

### 📱 **Modern UI/UX**
- Responsive design for desktop, tablet, and mobile
- Clean, professional interface with premium styling
- Accessibility features and keyboard navigation
- Loading states and error handling
- Dark/light theme support
- Intuitive navigation and user flows

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or later
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mca-college-management-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open [http://localhost:5000](http://localhost:5000) in your browser

---

## 👤 Login Credentials

### Administrator Account
- **Username:** `thams.ca@bhc.edu.in`
- **Password:** `Azzi@2026`
- **Role:** Admin
- **Permissions:** Full CRUD access to all modules (students, events, analytics, reports)

### Staff Account
- **Username:** `staff@bhc.edu.in`
- **Password:** `Staff@MCA`
- **Role:** Staff
- **Permissions:** Read-only access to view students, events, and data (cannot add, edit, or delete)

---

## 🏗️ System Architecture

### **Frontend Stack**
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript for type safety
- **UI Library:** Shadcn/ui components built on Radix UI
- **Styling:** Tailwind CSS with custom design system
- **State Management:** React hooks and local state
- **Forms:** React Hook Form with Zod validation

### **Backend & Data**
- **API:** Next.js API routes with RESTful endpoints
- **Database:** Local JSON file storage system
- **Authentication:** Session-based with bcrypt password hashing
- **File Storage:** Local file system for photos and documents
- **PDF Processing:** pdf-parse with OCR fallback using Tesseract.js

### **Security Features**
- Middleware-based route protection
- Role-based API access control
- Security headers (X-Frame-Options, CSP, etc.)
- Input validation and sanitization
- Secure session management

---

## 📚 Feature Documentation

### **Student Management**

#### Adding Students
- Individual student creation with comprehensive form
- Bulk import from PDF files (supports both text and scanned PDFs)
- Photo upload with validation and storage
- Batch and section assignment

#### Student Data
- Personal information (name, roll number, email, phone)
- Academic details (batch, section, class)
- Photo management
- Activity participation tracking

### **Event Management**

#### Event Creation
- Event details (title, date, location, description)
- Chief guest information
- Budget and fund allocation
- Event type categorization (competition, workshop, festival, etc.)

#### Participant Management
- Add participants to events
- Track attendance and participation
- Winner selection and award tracking
- Event photo and document uploads

### **Analytics Dashboard**

#### Overview Statistics
- Total students count
- Events conducted
- Budget utilization
- Top performing students

#### Advanced Analytics
- Date range filtering
- Trend analysis
- Performance metrics
- Export capabilities

---

## 🛠️ API Documentation

### **Authentication**
```
POST /api/auth/login - User login
```

### **Students API**
```
GET    /api/students           - List students (with pagination, search, filters)
POST   /api/students           - Create new student (Admin only)
GET    /api/students/[id]      - Get student details
PUT    /api/students/[id]      - Update student (Admin only)
DELETE /api/students/[id]      - Delete student (Admin only)
POST   /api/students/upload-pdf - Bulk import from PDF (Admin only)
POST   /api/students/upload-photo - Upload student photo (Admin only)
POST   /api/students/bulk-delete - Bulk delete students (Admin only)
```

### **Events API**
```
GET    /api/events            - List events (with pagination, search, filters)
POST   /api/events            - Create new event (Admin only)
GET    /api/events/[id]       - Get event details
PUT    /api/events/[id]       - Update event (Admin only)
DELETE /api/events/[id]       - Delete event (Admin only)
POST   /api/events/[id]/attendance - Mark attendance (Admin only)
```

### **Analytics API**
```
GET    /api/analytics         - Get dashboard analytics
```

---

## 🔒 Security Implementation

### **Role-Based Access Control**

#### Admin Permissions:
- Full CRUD operations on all modules
- User management capabilities
- System configuration access
- Analytics and reporting access
- File upload and management

#### Staff Permissions:
- Read-only access to student data
- Read-only access to event information
- View analytics and reports
- No create, update, or delete operations

### **Security Measures**
- Server-side route protection via middleware
- API endpoint authorization checks
- Secure password hashing with bcrypt
- Session timeout management
- CSRF protection
- Input validation and sanitization
- File upload security checks

---

## 📋 Advanced Features

### **Bulk PDF Import**
1. Navigate to Student Management (Admin only)
2. Click "Bulk Add Students from PDF"
3. Upload PDF containing student data
4. System automatically extracts information
5. Review and confirm imported data
6. OCR support for scanned documents

### **Photo Management**
- Secure photo upload with validation
- Automatic resizing and optimization
- Organized storage by student batches
- Photo preview and management

### **Search & Filtering**
- Advanced search across all data
- Multiple filter combinations
- Real-time search results
- Export filtered data

---

## 🚀 Deployment

### **Development**
```bash
npm run dev
```

### **Production Build**
```bash
npm run build
npm start
```

### **Environment Configuration**
The application uses local storage and doesn't require external databases, making deployment simple and efficient.

---

## 🛠️ Development

### **Project Structure**
```
├── app/                    # Next.js App Router pages
├── components/            # Reusable React components
├── lib/                  # Utility functions and database
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── data/                 # Local data storage
└── middleware.ts         # Route protection middleware
```

### **Key Technologies**
- **Next.js 14:** React framework with App Router
- **TypeScript:** Type-safe JavaScript
- **Tailwind CSS:** Utility-first CSS framework
- **Radix UI:** Accessible component primitives
- **React Hook Form:** Form handling
- **Zod:** Schema validation
- **date-fns:** Date utility library
- **Recharts:** Chart library for analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For questions, support, or bug reports:
- **Email:** [ca245213133@bhc.edu.in](mailto:ca245213133@bhc.edu.in)
- **Developer:** Mohamed Azzim J
- **Role:** President, MCA Association 2025-2026
- **Batch:** II MCA A, 2024-2026

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Bishop Heber College** for providing the platform for this project
- **MCA Department** for supporting student-led initiatives
- **Open Source Community** for the amazing tools and libraries used
- **Next.js Team** for the excellent framework
- **Vercel** for hosting and deployment solutions

---

*Built with ❤️ for the MCA Department, Bishop Heber College*