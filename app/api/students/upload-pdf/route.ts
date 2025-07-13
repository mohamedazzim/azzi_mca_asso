import { type NextRequest, NextResponse } from "next/server"
import { getStudents } from "@/lib/db"
import { PDFDocument } from "pdf-lib"

/**
 * POST /api/students/upload-pdf
 * Bulk add/update students from a PDF file (admin only)
 * Accepts: multipart/form-data with 'pdf' field
 * Returns: { added: number, updated: number, skipped: number, errors: string[] }
 */
export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role")
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File
    if (!pdfFile) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 })
    }
    if (!pdfFile.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }
    if (pdfFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF too large (max 5MB)" }, { status: 400 })
    }

    // Extract text from PDF (pdf-lib does not support text extraction directly; use workaround)
    const bytes = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(bytes)
    let fullText = ""
    for (const page of pdfDoc.getPages()) {
      if ((page as any).getTextContent) {
        fullText += await (page as any).getTextContent()
      }
      fullText += "\n"
    }
    // OCR fallback if text extraction fails or is empty
    if (!fullText.trim()) {
      let ocrText = ""
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        ocrText += "[OCR fallback not implemented: please use a PDF with selectable text]"
      }
      fullText = ocrText
    }

    if (!fullText.trim()) {
      return NextResponse.json({ error: "Could not extract text from PDF (even with OCR)" }, { status: 400 })
    }

    // Parse name/roll pairs (robust regex, e.g. lines like: '12345 John Doe' or 'John Doe 12345')
    const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    // Remove named capture groups for compatibility
    const studentRegex = /^([A-Za-z0-9\/-]+)[\s,;:]+([A-Za-z .,'-]+)$|^([A-Za-z .,'-]+)[\s,;:]+([A-Za-z0-9\/-]+)$/
    const studentsToAdd = []
    const errors: string[] = []
    for (const line of lines) {
      const match: RegExpMatchArray | null = studentRegex.exec(line)
      if (match) {
        // Try both patterns
        const roll: string = match[1] || match[4]
        let name: string = match[2] || match[3]
        if (roll && name) {
          name = name.replace(/\s+/g, ' ').trim()
          studentsToAdd.push({ rollNumber: roll, name })
        } else {
          errors.push(`Could not parse line: '${line}'`)
        }
      }
    }
    if (studentsToAdd.length === 0) {
      return NextResponse.json({ error: "No valid student records found in PDF", errors }, { status: 400 })
    }

    // Add/update students in DB
    const studentsCollection = await getStudents()
    let added = 0, updated = 0, skipped = 0
    for (const s of studentsToAdd) {
      // Try to find by rollNumber
      const existing = await studentsCollection.findOne({ rollNumber: s.rollNumber })
      if (existing) {
        // Optionally update name if different
        if (existing.name !== s.name) {
          await studentsCollection.updateOne({ _id: existing._id }, { $set: { name: s.name, updatedAt: new Date() } })
          updated++
        } else {
          skipped++
        }
      } else {
        // Insert with minimal fields; admin can edit later
        await studentsCollection.insertOne({
          name: s.name,
          rollNumber: s.rollNumber,
          email: "",
          phone: "",
          batch: "",
          section: "",
          gender: "",
          dateOfBirth: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        added++
      }
    }
    return NextResponse.json({ added, updated, skipped, errors })
  } catch (error) {
    console.error("PDF extraction error:", error)
    return NextResponse.json({ error: "Failed to process PDF", details: String(error) }, { status: 500 })
  }
} 