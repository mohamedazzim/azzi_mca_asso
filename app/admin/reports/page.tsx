"use client"

import { useEffect, useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventReport {
  id: string
  title: string
  reportUrl: string
  eventDate: string
  class?: string
  batch?: string
}

// Memoized components for better performance
const ReportRow = memo<{ report: EventReport }>(({ report }) => (
  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
    <td className="p-2 font-medium">{report.title}</td>
    <td className="p-2">
      {report.eventDate ? new Date(report.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "-"}
    </td>
    <td className="p-2">
      <Button 
        variant="outline" 
        size="sm" 
        asChild
        className="text-blue-600 hover:text-blue-700"
      >
        <a href={report.reportUrl} target="_blank" rel="noopener noreferrer">
          <FileText className="h-4 w-4 mr-1" />
          View/Download
        </a>
      </Button>
    </td>
  </tr>
))

// Skeleton loaders
const TableSkeleton = () => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm border text-center align-middle">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2">Event/Workshop</th>
          <th className="p-2">Date</th>
          <th className="p-2">Report</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="p-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </td>
            <td className="p-2">
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
            </td>
            <td className="p-2">
              <div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const SearchSkeleton = () => (
  <div className="flex flex-col md:flex-row gap-4 mb-4">
    <div className="h-10 bg-gray-200 rounded w-full md:w-1/2 animate-pulse"></div>
    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
  </div>
)

export default function ReportsPage() {
  const [reports, setReports] = useState<EventReport[]>([])
  const [filtered, setFiltered] = useState<EventReport[]>([])
  const [search, setSearch] = useState("")
  const [year, setYear] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/events")
        if (!res.ok) {
          setReports([])
          setFiltered([])
          return
        }
        const data = await res.json()
        // Only events with a reportUrl
        const reports = (data.events || []).filter((e: any) => e.reportUrl).map((e: any) => ({
          id: e.id,
          title: e.title,
          reportUrl: e.reportUrl,
          eventDate: e.date,
          class: e.class,
          batch: e.batch,
        }))
        setReports(reports)
        setFiltered(reports)
      } catch (error) {
        // Reports fetch error handled silently in production
        setReports([])
        setFiltered([])
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  useEffect(() => {
    let filtered = reports
    if (search) {
      filtered = filtered.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    }
    if (year !== "all") {
      filtered = filtered.filter(r => r.eventDate && new Date(r.eventDate).getFullYear().toString() === year)
    }
    setFiltered(filtered)
  }, [search, year, reports])

  // Get unique years and classes for filters
  const years = Array.from(new Set(reports.map(r => r.eventDate && new Date(r.eventDate).getFullYear().toString()))).filter(Boolean)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchSkeleton />
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input
              placeholder="Search by event or workshop name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-1/2"
            />
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No reports available.</p>
              <p className="text-sm">Reports will appear here once events are completed and reports are uploaded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border text-center align-middle">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Event/Workshop</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(report => (
                    <ReportRow key={report.id} report={report} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 