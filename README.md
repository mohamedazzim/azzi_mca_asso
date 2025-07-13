# College Management System

A modern, production-ready, open-source platform for managing students, events, analytics, and more. Built with Next.js, TypeScript, and MongoDB.

---

## 🚀 Features

- **Student Management:** Add, edit, delete, and view students with photo upload and batch/section/class info.
- **Bulk PDF Import:** Upload a PDF of student names/rolls—system auto-extracts and adds/updates records (with OCR fallback for scanned PDFs).
- **Event Management:** Create, edit, and track events, participants, and winners.
- **Analytics Dashboard:** Visualize key stats and trends (with date range filters).
- **Role-Based Access:** Strict admin/staff separation, enforced in frontend and backend.
- **Photo Upload:** Secure, validated, and stored in MongoDB.
- **Responsive UI:** Works beautifully on desktop, tablet, and mobile.
- **Production-Ready:** Security, validation, error handling, and Docker support.
- **Advanced Search & Pagination:** For students and events, with bulk actions and export.
- **Accessibility:** Improved error/loading/not-found pages, keyboard navigation, and ARIA roles.

---

## 🖼️ Screenshots

> _Add screenshots or GIFs of the dashboard, student list, PDF import dialog, etc._

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- npm (or pnpm/yarn, but npm is default)

### Installation

```bash
git clone <repository-url>
cd college-management-system
npm install
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and secrets
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 👤 Demo Credentials

- **Admin:** `admin` / `admin123`
- **Staff:** `staff` / `staff123`

---

## 📝 Bulk PDF Import

1. Go to **Student Management** as admin.
2. Click **Bulk Add Students from PDF**.
3. Upload a PDF with lines like:  
   `245213133 Mohamed Azzim J`
4. The system extracts, adds/updates students, and shows a summary.
5. **Scanned PDFs:** OCR fallback is enabled (requires Tesseract.js and a server-side PDF renderer for full support).

---

## 🔒 Security & Best Practices

- All sensitive actions require admin role (checked in frontend and backend).
- All user input is validated and sanitized.
- File uploads are type/size checked.
- Secure session cookies.
- No debug logs in production.

---

## 🧑‍💻 Developer Guide

- Modular, commented code.
- Extend PDF extraction logic in `app/api/students/upload-pdf/route.ts`.
- Add new endpoints or UI features easily.
- Run `npm run lint` and `npm run build` before deploying.

---

## 🐳 Docker Deployment

```bash
docker build -t college-management-system .
docker run -p 3000:3000 -e MONGODB_URI=your-mongodb-uri college-management-system
```

---

## 🛠️ API Endpoints

### Students
- `GET /api/students` — List students (supports `search`, `page`, `pageSize`, `batch`, `section`)
- `POST /api/students` — Add student
- `POST /api/students/upload-pdf` — Bulk add from PDF
- `POST /api/students/upload-photo` — Upload photo
- `POST /api/students/bulk-delete` — Bulk delete students (admin only)
- `GET /api/students/[id]` — Get student
- `PUT /api/students/[id]` — Update student
- `DELETE /api/students/[id]` — Delete student

### Events
- `GET /api/events` — List events (supports `search`, `page`, `pageSize`, `type`, `status`, `startDate`, `endDate`, `export=csv`)
- `POST /api/events` — Add event
- `GET /api/events/[id]` — Get event
- `PUT /api/events/[id]` — Update event
- `DELETE /api/events/[id]` — Delete event

### Analytics
- `GET /api/analytics` — Get analytics (supports `startDate`, `endDate`)

---

## 🧩 Contributing

1. Fork the repo and create your branch.
2. Make your changes with clear commits.
3. Add/modify tests if needed.
4. Open a pull request!

---

## ❓ Troubleshooting

- **Photo upload fails:** Check file type/size and MongoDB connection.
- **PDF import fails:** Ensure PDF is not scanned, or enable OCR support.
- **Build errors:** Run `npm run lint` and fix any issues.

---

## 📄 License

MIT

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [pdf-lib](https://pdf-lib.js.org/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [MongoDB](https://www.mongodb.com/)

---

## 📬 Support / Contact

For help, questions, or bug reports, email: [ca245213133@bhc.edu.in](mailto:ca245213133@bhc.edu.in) 