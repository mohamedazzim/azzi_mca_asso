"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/loading-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Trophy,
  Target,
  BookOpen,
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

// Metric card component
interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  color = 'default',
  loading = false
}: MetricCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }

  const trendIcon = trend?.direction === 'up' ? TrendingUp : 
                   trend?.direction === 'down' ? TrendingDown : Activity

  const TrendIcon = trendIcon

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-muted animate-pulse rounded w-24" />
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2" />
          <div className="h-3 bg-muted animate-pulse rounded w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className={cn("h-4 w-4", colorClasses[color])}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold mb-1", colorClasses[color])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs">
            <TrendIcon className={cn(
              "mr-1 h-3 w-3",
              trend.direction === 'up' ? "text-green-600" :
              trend.direction === 'down' ? "text-red-600" : "text-muted-foreground"
            )} />
            <span className={cn(
              trend.direction === 'up' ? "text-green-600" :
              trend.direction === 'down' ? "text-red-600" : "text-muted-foreground"
            )}>
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Chart placeholder component (would integrate with a charting library)
interface ChartCardProps {
  title: string
  description?: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: any[]
  height?: number
  loading?: boolean
  actions?: React.ReactNode
}

export function ChartCard({
  title,
  description,
  type,
  data,
  height = 300,
  loading = false,
  actions
}: ChartCardProps) {
  const chartIcon = type === 'pie' ? PieChart : BarChart3

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-32 mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-48" />
        </CardHeader>
        <CardContent>
          <div 
            className="bg-muted animate-pulse rounded w-full"
            style={{ height: `${height}px` }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <chartIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>
        {/* Placeholder for actual chart implementation */}
        <div 
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/10"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <chartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart
            </p>
            <p className="text-xs text-muted-foreground/75">
              {data.length} data points
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Analytics overview grid
interface AnalyticsOverviewProps {
  data: {
    totalStudents: number
    totalEvents: number
    totalAchievements: number
    activeStudents: number
  }
  loading?: boolean
}

export function AnalyticsOverview({ data, loading = false }: AnalyticsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Students"
        value={data.totalStudents}
        description="Enrolled students"
        icon={<Users />}
        color="info"
        loading={loading}
        trend={{
          value: 12,
          label: "from last month",
          direction: 'up'
        }}
      />
      <MetricCard
        title="Total Events"
        value={data.totalEvents}
        description="Events conducted"
        icon={<Calendar />}
        color="success"
        loading={loading}
        trend={{
          value: 8,
          label: "from last month",
          direction: 'up'
        }}
      />
      <MetricCard
        title="Achievements"
        value={data.totalAchievements}
        description="Student achievements"
        icon={<Trophy />}
        color="warning"
        loading={loading}
        trend={{
          value: 25,
          label: "from last month",
          direction: 'up'
        }}
      />
      <MetricCard
        title="Active Students"
        value={data.activeStudents}
        description="Currently active"
        icon={<Target />}
        color="success"
        loading={loading}
        trend={{
          value: 2,
          label: "from last month",
          direction: 'up'
        }}
      />
    </div>
  )
}

// Student analytics section
interface StudentAnalyticsProps {
  data: {
    studentsByBatch: Record<string, number>
    studentsByGender: Record<string, number>
    ageDistribution: Record<string, number>
    hostellerStats: {
      hostellers: number
      dayScholars: number
    }
  }
  loading?: boolean
}

export function StudentAnalytics({ data, loading = false }: StudentAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ChartCard
        title="Students by Batch"
        description="Distribution across academic years"
        type="bar"
        data={Object.entries(data.studentsByBatch).map(([batch, count]) => ({ batch, count }))}
        loading={loading}
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />
      
      <ChartCard
        title="Gender Distribution"
        description="Student demographics"
        type="pie"
        data={Object.entries(data.studentsByGender).map(([gender, count]) => ({ gender, count }))}
        loading={loading}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Accommodation Status
          </CardTitle>
          <CardDescription>Hosteller vs Day Scholar distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hostellers</span>
              <span className="font-medium">{data.hostellerStats.hostellers}</span>
            </div>
            <Progress 
              value={data.hostellerStats.hostellers} 
              max={data.hostellerStats.hostellers + data.hostellerStats.dayScholars}
              variant="success"
              showLabel={false}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Day Scholars</span>
              <span className="font-medium">{data.hostellerStats.dayScholars}</span>
            </div>
            <Progress 
              value={data.hostellerStats.dayScholars} 
              max={data.hostellerStats.hostellers + data.hostellerStats.dayScholars}
              variant="info"
              showLabel={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Performance analytics section
interface PerformanceAnalyticsProps {
  data: {
    averagePerformanceScore: number
    performanceDistribution: Record<string, number>
    topPerformers: Array<{
      name: string
      rollNumber: string
      performanceScore: number
      achievementsCount: number
    }>
  }
  loading?: boolean
}

export function PerformanceAnalytics({ data, loading = false }: PerformanceAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {data.averagePerformanceScore.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">Average Performance Score</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Score</span>
              <span className="font-medium">{data.averagePerformanceScore.toFixed(1)}/100</span>
            </div>
            <Progress 
              value={data.averagePerformanceScore} 
              max={100}
              variant={data.averagePerformanceScore >= 80 ? "success" : 
                     data.averagePerformanceScore >= 60 ? "warning" : "error"}
              showLabel={false}
            />
          </div>
        </CardContent>
      </Card>
      
      <ChartCard
        title="Performance Distribution"
        description="Score ranges across students"
        type="bar"
        data={Object.entries(data.performanceDistribution).map(([range, count]) => ({ range, count }))}
        loading={loading}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Students with highest achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted animate-pulse rounded w-24" />
                    <div className="h-3 bg-muted animate-pulse rounded w-16" />
                  </div>
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                </div>
              ))
            ) : (
              data.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={performer.rollNumber} className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{performer.name}</p>
                    <p className="text-xs text-muted-foreground">{performer.rollNumber}</p>
                  </div>
                  <Badge variant="secondary">
                    {performer.performanceScore.toFixed(0)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Insights and trends section
interface InsightsProps {
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    metric: string
    change: number
  }>
  loading?: boolean
}

export function AnalyticsInsights({ insights, loading = false }: InsightsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-48" />
                <div className="h-3 bg-muted animate-pulse rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Key Insights
        </CardTitle>
        <CardDescription>Automated analysis and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={cn(
                "p-4 rounded-lg border-l-4",
                insight.type === 'positive' ? "bg-green-50 border-l-green-500 dark:bg-green-950" :
                insight.type === 'negative' ? "bg-red-50 border-l-red-500 dark:bg-red-950" :
                "bg-blue-50 border-l-blue-500 dark:bg-blue-950"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{insight.title}</h4>
                <Badge 
                  variant={
                    insight.type === 'positive' ? 'default' :
                    insight.type === 'negative' ? 'destructive' : 'secondary'
                  }
                >
                  {insight.metric}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}