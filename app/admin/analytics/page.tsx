"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, TrendingUp, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface AnalyticsData {
  overview: {
    totalStudents: number
    totalEvents: number
    totalParticipations: number
    totalWinners: number
    averageAttendance: number
    budgetUtilized: number
  }
  monthlyTrends: Array<{
    month: string
    events: number
    participants: number
    budget: number
  }>
  topPerformers: Array<{
    name: string
    rollNumber: string
    events: number
    awards: number
    photo?: string
  }>
  eventTypes: Array<{
    type: string
    count: number
    participation: number
  }>
}

// Memoized components for better performance
const StatsCard = memo<{ title: string; value: string | number; icon: React.ElementType; color: string; subtitle: string }>(
  ({ title, value, icon: Icon, color, subtitle }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {subtitle}
            </p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
)
StatsCard.displayName = "StatsCard"

interface MonthlyTrend {
  month: string;
  events: number;
  participants: number;
  budget: number;
}
const MonthlyTrendCard = memo<{ month: MonthlyTrend }>(({ month }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center space-x-4">
      <div className="font-medium">{month.month}</div>
      <Badge variant="outline">{month.events} events</Badge>
    </div>
    <div className="text-right">
      <div className="font-medium">{month.participants} participants</div>
      <div className="text-sm text-gray-600">₹{month.budget.toLocaleString()}</div>
    </div>
  </div>
))
MonthlyTrendCard.displayName = "MonthlyTrendCard"

interface TopPerformerProps {
  performer: {
    name: string
    rollNumber: string
    events: number
    awards: number
    photo?: string
  }
}

const TopPerformer = memo<TopPerformerProps>(({ performer }) => (
  <Link href={`/admin/students/${performer.rollNumber}`} className="block">
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <Avatar className="h-10 w-10">
        <AvatarImage src={performer.photo} alt={performer.name} />
        <AvatarFallback>{performer.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
      </Avatar>
      <div>
        <div className="font-semibold">{performer.name}</div>
        <div className="text-xs text-gray-500">Roll: {performer.rollNumber}</div>
        <div className="text-xs text-green-700 font-bold">Awards: {performer.awards}</div>
      </div>
    </div>
  </Link>
))
TopPerformer.displayName = "TopPerformer"

interface EventType {
  type: string;
  count: number;
  participation: number;
}
const EventTypeCard = memo<{ eventType: EventType }>(({ eventType }) => (
  <div className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <h3 className="font-semibold text-lg mb-2">{eventType.type}</h3>
    <div className="space-y-2">
      <div>
        <span className="text-2xl font-bold text-blue-600">{eventType.count}</span>
        <p className="text-sm text-gray-600">Events Conducted</p>
      </div>
      <div>
        <span className="text-xl font-semibold text-green-600">{eventType.participation}</span>
        <p className="text-sm text-gray-600">Total Participation</p>
      </div>
      <div>
        <span className="text-lg font-medium text-purple-600">
          {eventType.count > 0 ? Math.round((eventType.participation / eventType.count)) : 0}
        </span>
        <p className="text-sm text-gray-600">Avg. Participation</p>
      </div>
    </div>
  </div>
))
EventTypeCard.displayName = "EventTypeCard"

// Skeleton loaders
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const TrendsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="text-right space-y-1">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
)

const PerformersSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white shadow-sm animate-pulse">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
)

const EventTypesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="text-center p-6 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
        <div className="space-y-2">
          <div>
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto mt-1"></div>
          </div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto mt-1"></div>
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-8 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto mt-1"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

function AnalyticsPageContent() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch analytics data from API
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const response = await fetch(`/api/analytics?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, startDate, endDate])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StatsSkeleton />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Event Trends</CardTitle>
                <CardDescription>Events and participation over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendsSkeleton />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Students with highest participation and awards</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformersSkeleton />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Categories Analysis</CardTitle>
              <CardDescription>Breakdown of events by type and participation</CardDescription>
            </CardHeader>
            <CardContent>
              <EventTypesSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">No analytics data available</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: "Total Students",
      value: analytics.overview.totalStudents,
      icon: Users,
      color: "text-blue-600",
      subtitle: "Active students"
    },
    {
      title: "Total Events",
      value: analytics.overview.totalEvents,
      icon: Calendar,
      color: "text-green-600",
      subtitle: "Events conducted"
    },
    {
      title: "Budget Utilized",
      value: `₹${analytics.overview.budgetUtilized.toLocaleString()}`,
      icon: () => <div className="text-2xl">💰</div>,
      color: "text-purple-600",
      subtitle: "Total spent"
    }
  ]

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
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                <p className="text-gray-600">Comprehensive insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
              <span className="mx-1">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
          {(startDate || endDate) && (
            <div className="text-sm text-gray-600 mt-2">
              Showing analytics for: {startDate ? startDate : '...'} to {endDate ? endDate : '...'}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Event Trends</CardTitle>
              <CardDescription>Events and participation over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrends.map((month, index) => (
                  <MonthlyTrendCard key={index} month={month} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Students with highest participation and awards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPerformers.map((performer, idx) => (
                  <TopPerformer key={idx} performer={performer} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Types Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Event Categories Analysis</CardTitle>
            <CardDescription>Breakdown of events by type and participation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics.eventTypes.map((eventType, index) => (
                <EventTypeCard key={index} eventType={eventType} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AnalyticsPageContent />
    </AuthGuard>
  )
}
