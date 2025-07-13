"use client"

import { useEffect, useState, memo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, Calendar, Trophy, DollarSign, LogOut, Filter, Loader2 } from "lucide-react"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import type { User } from "@/lib/db"

interface StaffStudent {
  id: number;
  name: string;
  rollNumber: string;
  class: string;
  batch: string;
  eventsParticipated: number;
  awards: number;
  photo: string;
}

interface StaffEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  participants: number;
  winners: number;
  fundSpent: number;
}

// Memoized components for better performance
const StatsCard = memo(({ stat }: { stat: any }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </div>
        <stat.icon className={`h-8 w-8 ${stat.color}`} />
      </div>
    </CardContent>
  </Card>
))

const StudentCard = memo(({ student }: { student: StaffStudent }) => (
  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-start space-x-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={student.photo || "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg"} alt={student.name} />
        <AvatarFallback>
          {student.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{student.name}</h3>
            <p className="text-gray-600">
              {student.rollNumber} • {student.class}
            </p>
          </div>
          <Badge variant="secondary">{student.batch}</Badge>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Events Participated:</span>
            <span className="ml-2 font-medium">{student.eventsParticipated}</span>
          </div>
          <div>
            <span className="text-gray-600">Awards Won:</span>
            <span className="ml-2 font-medium">{student.awards}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
))

const EventCard = memo(({ event }: { event: StaffEvent }) => (
  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{event.title}</h3>
        <p className="text-gray-600">
          {event.location} • {new Date(event.date).toLocaleDateString()}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Participants:</span>
            <span className="ml-2 font-medium">{event.participants}</span>
          </div>
          <div>
            <span className="text-gray-600">Winners:</span>
            <span className="ml-2 font-medium">{event.winners}</span>
          </div>
          <div>
            <span className="text-gray-600">Fund Spent:</span>
            <span className="ml-2 font-medium">₹{event.fundSpent.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <Badge variant="outline">Completed</Badge>
    </div>
  </div>
))

// Skeleton loaders
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const StudentCardSkeleton = () => (
  <div className="border rounded-lg p-4 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
)

const EventCardSkeleton = () => (
  <div className="border rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded"></div>
    </div>
  </div>
)

function StaffDashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("student")
  const [classFilter, setClassFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    // Simulate loading time for better UX
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const stats = [
    { title: "Total Students", value: "156", icon: Users, color: "text-blue-600" },
    { title: "Events Conducted", value: "24", icon: Calendar, color: "text-green-600" },
    { title: "Total Winners", value: "48", icon: Trophy, color: "text-yellow-600" },
    { title: "Funds Utilized", value: "₹2,45,000", icon: DollarSign, color: "text-purple-600" },
  ]

  const students: StaffStudent[] = [
    {
      id: 1,
      name: "Rahul Sharma",
      rollNumber: "MCA24A001",
      class: "1st MCA A",
      batch: "2024-2026",
      eventsParticipated: 5,
      awards: 2,
      photo: "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg",
    },
    {
      id: 2,
      name: "Priya Patel",
      rollNumber: "MCA23B015",
      class: "2nd MCA B",
      batch: "2023-2025",
      eventsParticipated: 8,
      awards: 3,
      photo: "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg",
    },
    {
      id: 3,
      name: "Amit Kumar",
      rollNumber: "MCA24B008",
      class: "1st MCA B",
      batch: "2024-2026",
      eventsParticipated: 3,
      awards: 1,
      photo: "https://res.cloudinary.com/dgxjdpnze/raw/upload/v1752423664/static/placeholders/1752423659099-placeholder.svg",
    },
  ]

  const events: StaffEvent[] = [
    {
      id: 1,
      title: "Tech Symposium 2024",
      date: "2024-12-15",
      location: "Main Hall",
      participants: 45,
      winners: 3,
      fundSpent: 25000,
    },
    {
      id: 2,
      title: "Coding Competition",
      date: "2024-11-20",
      location: "Computer Lab 1",
      participants: 32,
      winners: 5,
      fundSpent: 15000,
    },
  ]

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StatsSkeleton />
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Find students, events, and participation data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Records</CardTitle>
              <CardDescription>Student profiles with participation history and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <StudentCardSkeleton key={i} />
                ))}
              </div>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.username || "Staff"}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} stat={stat} />
          ))}
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find students, events, and participation data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Search Students</SelectItem>
                  <SelectItem value="event">Search Events</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchType === "student" ? "Student name or roll number..." : "Event name..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchType === "student" && (
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="1st MCA A">1st MCA A</SelectItem>
                    <SelectItem value="1st MCA B">1st MCA B</SelectItem>
                    <SelectItem value="2nd MCA A">2nd MCA A</SelectItem>
                    <SelectItem value="2nd MCA B">2nd MCA B</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>{searchType === "student" ? "Student Records" : "Event Records"}</CardTitle>
            <CardDescription>
              {searchType === "student"
                ? "Student profiles with participation history and achievements"
                : "Event details with participation and results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchType === "student" ? (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StaffDashboard() {
  return (
    <AuthGuard requiredRole="staff">
      <StaffDashboardContent />
    </AuthGuard>
  )
}
