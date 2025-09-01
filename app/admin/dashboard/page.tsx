"use client"

import { useEffect, useState, memo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Trophy, DollarSign, BarChart3, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import type { User } from "@/lib/db"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface DashboardStats {
  totalStudents: number
  totalEvents: number
  totalWinners: number
  totalFunds: number
}

interface RecentStudent {
  id: string
  name: string
  class?: string
  batch: string
  section?: string
  createdAt: string
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  location: string
  description?: string
}

interface StatsCardProps {
  stat: {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
  };
}

interface QuickActionProps {
  action: {
    title: string;
    href: string;
    icon: React.ElementType;
  };
}

interface TopPerformerProps {
  student: {
    id: string;
    name: string;
    rollNumber: string;
    awards: number;
    photo?: string;
  };
  idx: number;
}

// Memoized components for better performance
const StatsCard = memo<StatsCardProps>(({ stat }) => (
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
StatsCard.displayName = "StatsCard"

const QuickActionButton = memo<QuickActionProps>(({ action }) => (
  <Link href={action.href}>
    <Button
      variant="outline"
      className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 bg-transparent"
    >
      <action.icon className="h-6 w-6" />
      <span className="text-sm">{action.title}</span>
    </Button>
  </Link>
))
QuickActionButton.displayName = "QuickActionButton"

const EventCard = memo<{ event: UpcomingEvent }>(({ event }) => (
  <Link href={`/admin/events/${event.id}`} className="block">
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-1 border hover:bg-blue-50 transition cursor-pointer">
      <div className="font-semibold text-gray-900">{event.title}</div>
      <div className="text-xs text-gray-500">
        {event.date ? new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
      </div>
      <div className="text-xs text-gray-600">{event.location}</div>
      <div className="text-sm text-gray-700 mt-1">{event.description || "No description"}</div>
    </div>
  </Link>
))
EventCard.displayName = "EventCard"

const TopPerformerCard = memo<TopPerformerProps>(({ student }) => (
  <Link href={`/admin/students/${student.id}`} className="block">
    <div className="flex flex-col items-center p-2 cursor-pointer hover:bg-gray-50 rounded">
      <Avatar className="h-12 w-12 mb-1">
        <AvatarImage 
          src={/^[a-f0-9]{24}$/i.test(student.name) ? undefined : student.photo} 
          alt={student.name} 
        />
        <AvatarFallback>
          {/^[a-f0-9]{24}$/i.test(student.name) ? '?' : (student.name ? student.name.split(' ').map((n: string) => n[0]).join('') : '?')}
        </AvatarFallback>
      </Avatar>
      <div className="text-base font-bold mb-0.5">
        {/^[a-f0-9]{24}$/i.test(student.name) ? 'Unknown Student' : student.name}
      </div>
      <div className="text-xs text-gray-600 mb-0">Roll: {student.rollNumber}</div>
      <div className="text-sm font-semibold text-green-700">Wins: {student.awards}</div>
    </div>
  </Link>
))
TopPerformerCard.displayName = "TopPerformerCard"

// Skeleton loaders
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {[...Array(3)].map((_, i) => (
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
StatsSkeleton.displayName = "StatsSkeleton"

const EventsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    ))}
  </div>
)
EventsSkeleton.displayName = "EventsSkeleton"

const TopPerformersSkeleton = () => (
  <div className="flex flex-col items-center justify-center py-2 gap-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex flex-col items-center p-2 animate-pulse">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    ))}
  </div>
)
TopPerformersSkeleton.displayName = "TopPerformersSkeleton"

function AdminDashboardContent() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalEvents: 0,
    totalWinners: 0,
    totalFunds: 0
  })
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [topPerformers, setTopPerformers] = useState<Array<{
    id: string;
    name: string;
    rollNumber: string;
    awards: number;
    photo?: string;
  }>>([]);

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsResponse = await fetch('/api/analytics')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          totalStudents: statsData.overview.totalStudents,
          totalEvents: statsData.overview.totalEvents,
          totalWinners: statsData.overview.totalWinners,
          totalFunds: statsData.overview.budgetUtilized
        })
        if (statsData.topPerformers && statsData.topPerformers.length > 0) {
          setTopPerformers(statsData.topPerformers.slice(0, 3));
        }
      }

      // Fetch recent events (all statuses, most recent first)
      const eventsResponse = await fetch('/api/events?limit=3&sort=desc')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setUpcomingEvents((eventsData.events || []).slice(0, 3))
      }
    } catch {
      // Only set loading to false, do not log error
    } finally {
      setLoading(false)
    }
  }

  // Remove 'Total Winners' from statsCards
  const statsCards = [
    { title: "Total Students", value: stats.totalStudents.toString(), icon: Users, color: "text-blue-600" },
    { title: "Events Conducted", value: stats.totalEvents.toString(), icon: Calendar, color: "text-green-600" },
    { title: "Funds Utilized", value: `₹${stats.totalFunds.toLocaleString()}`, icon: DollarSign, color: "text-purple-600" },
  ]

  const quickActions = [
    { title: "Add Student", href: "/admin/students/add", icon: Users },
    { title: "Create Event", href: "/admin/events/add", icon: Calendar },
    { title: "Manage Students", href: "/admin/students", icon: Users },
    { title: "Manage Events", href: "/admin/events", icon: Calendar },
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "Reports", href: "/admin/reports", icon: FileText },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StatsSkeleton />
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage students, events, and view analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Latest events conducted</CardDescription>
              </CardHeader>
              <CardContent>
                <EventsSkeleton />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top 3 Students</CardTitle>
                <CardDescription>Students with the most event wins</CardDescription>
              </CardHeader>
              <CardContent>
                <TopPerformersSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} stat={stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage students, events, and view analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <QuickActionButton key={index} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest events conducted</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No recent events found.</div>
              )}
            </CardContent>
          </Card>
          
          {/* Top 3 Students */}
          <Card>
            <CardHeader>
              <CardTitle>Top 3 Students</CardTitle>
              <CardDescription>Students with the most event wins</CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-2 gap-3">
                  {topPerformers.map((student, idx) => (
                    <TopPerformerCard key={idx} student={student} idx={idx} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No winners yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer Section */}
      <footer className="w-full bg-white border-t mt-8 py-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-2 px-4">
          <h2 className="text-lg font-bold text-blue-800 mb-0">Developed by</h2>
          <div className="w-10 border-b border-blue-200 mb-1"></div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <Image 
              src="/developer-photo.svg" 
              alt="Mohamed Azzim J" 
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow" 
            />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xl font-extrabold text-gray-900">Mohamed Azzim J</span>
                <a href="https://www.linkedin.com/in/mohamedazzimj/" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="inline-block align-middle">
                  <svg width="20" height="20" fill="currentColor" className="text-blue-700 hover:text-blue-900" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.036 0 3.6 2 3.6 4.59v5.606z"/></svg>
                </a>
              </div>
              <div className="text-xs text-gray-600 mb-0">II MCA A &bull; 2024-2026 Batch</div>
              <div className="text-xs text-blue-700 font-semibold mb-0">President, MCA Association 2025-2026</div>
              <h3 className="text-sm font-semibold text-gray-800 mt-1 mb-0">About Me</h3>
              <p className="text-gray-700 text-xs mb-0">
                Passionate full stack developer dedicated to building modern, scalable web applications for real-world impact. Experienced in React, Next.js, Node.js, MongoDB, and more.<br/>
                <span className="italic text-gray-500">&quot;Empowering the Department of Computer Application with technology.&quot;</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AuthGuard>
      <AdminDashboardContent />
    </AuthGuard>
  )
}
