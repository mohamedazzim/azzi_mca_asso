"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Edit, Trash2, ArrowLeft, Loader2, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getUserRole } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { ErrorAlert } from "@/components/ui/error-alert"
import { errorToast, successToast } from "@/components/ui/error-toast"
import { handleError, createErrorHandler } from "@/lib/error-handler"

interface Student {
  id: string
  name: string
  rollNumber: string
  email: string
  phone: string
  class: string
  batch: string
  gender: string
  dob: string
  photo: string
  isActive: boolean
  section: string
}

// Helper to convert year to Roman numeral
function getRomanYearFromBatch(batch: string): string {
  // Example batch: '2024-2026'
  const currentYear = new Date().getFullYear();
  const [startYear] = batch.split('-').map(Number);
  if (!startYear) return '';
  const diff = currentYear - startYear + 1;
  if (diff === 1) return 'I MCA';
  if (diff === 2) return 'II MCA';
  if (diff === 3) return 'III MCA';
  return '';
}

// Memoized components for better performance
interface StudentRowProps {
  student: Student
  selected: boolean
  onSelect: (id: string) => void
  canEdit: boolean
  deletingId: string | null
  deleteStudent: (id: string) => void
}

const StudentRow = memo<StudentRowProps>(({ student, selected, onSelect, canEdit, deletingId, deleteStudent }) => (
  <TableRow key={student.id}>
    <TableCell>
      <input type="checkbox" checked={selected} onChange={() => onSelect(student.id)} />
    </TableCell>
    <TableCell>
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={student.photo || undefined} alt={student.name} />
          <AvatarFallback className="text-xs">
            {student.name.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{student.name}</p>
          <p className="text-sm text-gray-600">{student.gender}</p>
        </div>
      </div>
    </TableCell>
    <TableCell>{student.rollNumber}</TableCell>
    <TableCell>{student.phone}</TableCell>
    <TableCell>{student.batch}</TableCell>
    <TableCell>{student.section}</TableCell>
    <TableCell>
      <div className="flex space-x-2">
        <Link href={`/admin/students/${student.id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
        {canEdit && (
          <Link href={`/admin/students/${student.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
        {canEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={deletingId === student.id}
              >
                {deletingId === student.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {student.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteStudent(student.id)}
                  disabled={deletingId === student.id}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === student.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TableCell>
  </TableRow>
))

// Skeleton loaders
const TableSkeleton = () => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Roll Number</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(10)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)

const SearchSkeleton = () => (
  <Card className="mb-6">
    <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
      <div className="relative flex-1">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
    </CardContent>
  </Card>
)

function StudentsPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { canEdit } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [batchFilter, setBatchFilter] = useState("all")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfResult, setPdfResult] = useState<any>(null)
  const [pdfError, setPdfError] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [sortField, setSortField] = useState<string>("rollNumber")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")


  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    const errorHandler = createErrorHandler("load student data", "student list retrieval")
    
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (classFilter !== 'all') params.append('class', classFilter)
      if (batchFilter !== 'all') params.append('batch', batchFilter)
      if (sectionFilter !== 'all') params.append('section', sectionFilter)
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      params.append('sortField', sortField)
      params.append('sortOrder', sortOrder)
      
      const response = await fetch(`/api/students?${params.toString()}`)
      
      if (!response.ok) {
        let errorMessage = "Failed to load student data"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          if (response.status === 500) {
            errorMessage = "Server error while loading students. Please try again."
          } else if (response.status === 404) {
            errorMessage = "Student data not found. Please check if students have been added."
          } else {
            errorMessage = `Failed to load students (Error ${response.status}). Please refresh and try again.`
          }
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (!data.students || !Array.isArray(data.students)) {
        throw new Error("Invalid student data received from server")
      }
      
      setStudents(data.students)
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setSelectedIds([])
      setSelectAll(false)
    } catch (error) {
      console.error('Error fetching students:', error)
      const errorMessage = error instanceof Error ? error.message : "Unable to load student data"
      setError(errorMessage)
      errorHandler(error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, classFilter, batchFilter, sectionFilter, page, pageSize, sortField, sortOrder])

  // Delete student
  const deleteStudent = async (id: string) => {
    const student = students.find(s => s.id === id)
    const studentName = student?.name || "Unknown Student"
    const errorHandler = createErrorHandler("delete student", `removing ${studentName} from records`)
    
    try {
      setDeletingId(id)
      const userRole = canEdit ? 'admin' : 'staff'
      
      if (!canEdit) {
        errorToast("You don't have permission to delete students", {
          title: "Permission Denied",
          duration: 5000
        })
        return
      }
      
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': userRole,
          'Content-Type': 'application/json'
        },
      })
      
      if (!response.ok) {
        let errorMessage = `Failed to delete ${studentName}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          if (response.status === 403) {
            errorMessage = `Permission denied. You cannot delete ${studentName}.`
          } else if (response.status === 404) {
            errorMessage = `${studentName} not found. They may have already been deleted.`
          } else if (response.status === 500) {
            errorMessage = `Server error while deleting ${studentName}. Please try again.`
          } else {
            errorMessage = `Failed to delete ${studentName} (Error ${response.status})`
          }
        }
        throw new Error(errorMessage)
      }

      successToast(`${studentName} deleted successfully`, {
        title: "Student Removed",
        duration: 4000
      })
      
      // Refresh the list
      await fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      errorHandler(error)
    } finally {
      setDeletingId(null)
    }
  }

  const handlePdfUpload = async (file: File) => {
    const errorHandler = createErrorHandler("upload PDF", `processing ${file.name} for student data import`)
    
    setPdfUploading(true)
    setPdfError("")
    setPdfResult(null)
    
    try {
      // Validate file
      if (!file) {
        throw new Error("No file selected for upload")
      }
      
      if (!file.type.includes('pdf')) {
        throw new Error("Please select a PDF file. Only PDF files are supported.")
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error("PDF file is too large. Please select a file smaller than 10MB.")
      }
      
      const storedData = JSON.parse(localStorage.getItem("user") || "{}")
      let userRole = ""
      if (storedData.role) userRole = storedData.role
      else if (storedData.user && storedData.user.role) userRole = storedData.user.role
      
      if (!userRole) {
        throw new Error("User role not found. Please log out and log back in.")
      }
      
      const formData = new FormData()
      formData.append("pdf", file)
      
      const response = await fetch("/api/students/upload-pdf", {
        method: "POST",
        headers: { 'x-user-role': userRole },
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        let errorMessage = result.error || "Failed to process PDF"
        
        if (response.status === 400) {
          errorMessage = result.error || "Invalid PDF format or content. Please check the file and try again."
        } else if (response.status === 413) {
          errorMessage = "PDF file is too large for processing. Please use a smaller file."
        } else if (response.status === 500) {
          errorMessage = "Server error while processing PDF. Please try again in a few moments."
        }
        
        setPdfError(errorMessage)
        setPdfResult(result)
        errorHandler(new Error(errorMessage), false) // Log but don't show toast
      } else {
        setPdfResult(result)
        successToast(`PDF processed successfully. ${result.imported || 0} students imported.`, {
          title: "Import Complete",
          duration: 5000
        })
        // Refresh students list
        await fetchStudents()
      }
    } catch (error) {
      console.error('PDF upload error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload PDF. Please try again."
      setPdfError(errorMessage)
      errorHandler(error, false) // Log but don't show toast since we show inline error
    } finally {
      setPdfUploading(false)
    }
  }

  // Fetch students on component mount and when filters change
  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage)
  }

  // Bulk select logic
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
      setSelectAll(false)
    } else {
      setSelectedIds(students.map(s => s.id))
      setSelectAll(true)
    }
  }
  const handleSelectOne = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected students?`)) return
    setLoading(true)
    try {
      const userRole = canEdit ? 'admin' : 'staff'
      const response = await fetch('/api/students/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete')
      toast({ title: 'Success', description: `Deleted ${result.deletedCount} students.` })
      fetchStudents()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to delete students', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = classFilter === "all" || student.class === classFilter
    const matchesBatch = batchFilter === "all" || student.batch === batchFilter
    const matchesSection = sectionFilter === "all" || student.section === sectionFilter
    return matchesSearch && matchesClass && matchesBatch && matchesSection
  })

  // Get unique batches and sections for filters
  const batches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));
  const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <ErrorAlert 
              title="Failed to Load Students"
              message={error}
              onClose={() => setError(null)}
              className="mb-6"
            />
          )}
          
          <SearchSkeleton />
          
          <Card>
            <CardHeader>
              <CardTitle>Students List</CardTitle>
              <CardDescription>All student records</CardDescription>
            </CardHeader>
            <CardContent>
              <TableSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <p className="text-gray-600">Manage all student records</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {canEdit && (
                  <Button onClick={() => router.push("/admin/students/add")}> <Plus className="mr-2 h-4 w-4" /> Add Student </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* PDF Upload Dialog */}
      {/* (Removed) */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <ErrorAlert 
            title="Data Loading Error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}
        
        {/* Search and Bulk Actions */}
        <Card className="mb-6">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                placeholder="Search by name, roll number, or phone..."
                  value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
            <Select value={batchFilter} onValueChange={val => { setBatchFilter(val); setPage(1); }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            <Select value={sectionFilter} onValueChange={val => { setSectionFilter(val); setPage(1); }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            <Button 
              variant="destructive" 
              disabled={selectedIds.length === 0 || loading} 
              onClick={handleBulkDelete}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </>
              )}
            </Button>
            <div className="text-sm text-gray-600">
              Total: {loading ? "..." : total} students
            </div>
          </CardContent>
        </Card>
        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students List</CardTitle>
            <CardDescription>All student records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
                    </TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-24" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-4 bg-gray-200 animate-pulse rounded" /></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 animate-pulse rounded w-24" />
                            <div className="h-3 bg-gray-200 animate-pulse rounded w-16" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 animate-pulse rounded w-16" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>Name
                        {sortField === "name" && (sortOrder === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("rollNumber")}>Roll Number
                        {sortField === "rollNumber" && (sortOrder === "asc" ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">No students found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map(student => (
                        <StudentRow 
                          key={student.id} 
                          student={student} 
                          selected={selectedIds.includes(student.id)} 
                          onSelect={handleSelectOne}
                          canEdit={canEdit}
                          deletingId={deletingId}
                          deleteStudent={deleteStudent}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Prev</Button>
                  <span>Page {page} of {totalPages}</span>
                  <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next</Button>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <AuthGuard>
      <StudentsPageContent />
    </AuthGuard>
  )
}
