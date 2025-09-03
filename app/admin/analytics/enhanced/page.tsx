"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  AnalyticsOverview,
  StudentAnalytics,
  PerformanceAnalytics,
  AnalyticsInsights,
  MetricCard
} from '@/components/dashboard/analytics-widgets';
import { 
  CalendarDays,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Trophy,
  Activity,
  FileText,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function EnhancedAnalyticsPage() {
  const { canView } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState('last_3_months');
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      params.append('type', 'comprehensive');

      const response = await fetch(`/api/analytics/advanced?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set predefined date ranges
  const setPredefinedRange = (period: string) => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'last_month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'last_3_months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'last_6_months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
    setSelectedPeriod(period);
  };

  // Export analytics
  const handleExport = async (format: string) => {
    setExporting(true);
    
    try {
      const exportData = {
        format,
        dateRange: dateRange.startDate && dateRange.endDate ? dateRange : undefined,
        includeCharts: true,
        sections: ['overview', 'students', 'events', 'performance']
      };

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (canView) {
      setPredefinedRange('last_3_months');
    }
  }, [canView]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAnalytics();
    }
  }, [dateRange]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to view analytics.</p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
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
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Enhanced Analytics
                </h1>
                <p className="text-gray-600">Comprehensive insights and data analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Date Range
            </CardTitle>
            <CardDescription>
              Customize your analytics view with date ranges and filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedPeriod} onValueChange={setPredefinedRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                placeholder="Start Date"
              />
              
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                placeholder="End Date"
              />
              
              <Button 
                onClick={() => fetchAnalytics(true)}
                disabled={!dateRange.startDate || !dateRange.endDate || refreshing}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analyticsData?.overview && (
              <AnalyticsOverview 
                data={analyticsData.overview} 
                loading={loading}
              />
            )}
            
            {/* Quick stats cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Data Freshness"
                value="Real-time"
                description="Last updated now"
                icon={<RefreshCw />}
                color="success"
                loading={loading}
              />
              <MetricCard
                title="Report Period"
                value={selectedPeriod.replace('_', ' ')}
                description={`${dateRange.startDate} to ${dateRange.endDate}`}
                icon={<CalendarDays />}
                color="info"
                loading={loading}
              />
              <MetricCard
                title="Export Status"
                value="Available"
                description="PDF, Excel, CSV formats"
                icon={<FileText />}
                color="default"
                loading={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {analyticsData?.students && (
              <StudentAnalytics 
                data={analyticsData.students} 
                loading={loading}
              />
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Total Events"
                value={analyticsData?.events?.totalEvents || 0}
                description="Events conducted"
                icon={<Calendar />}
                color="success"
                loading={loading}
                trend={{
                  value: 15,
                  label: "from last period",
                  direction: 'up'
                }}
              />
              <MetricCard
                title="This Month"
                value={analyticsData?.events?.eventsThisMonth || 0}
                description="Recent activity"
                icon={<Activity />}
                color="info"
                loading={loading}
              />
              <MetricCard
                title="Avg Participants"
                value={analyticsData?.events?.averageParticipants || 0}
                description="Per event"
                icon={<Users />}
                color="warning"
                loading={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {analyticsData?.performance && (
              <PerformanceAnalytics 
                data={analyticsData.performance} 
                loading={loading}
              />
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {analyticsData?.insights && (
              <AnalyticsInsights 
                insights={analyticsData.insights} 
                loading={loading}
              />
            )}
            
            {/* Trends section */}
            {analyticsData?.trends && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Growth Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        +{analyticsData.students?.newStudentsThisMonth || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">New students this month</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Event Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {analyticsData.events?.eventsThisMonth || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Events this month</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {analyticsData.performance?.averagePerformanceScore?.toFixed(1) || '0.0'}
                      </div>
                      <p className="text-sm text-muted-foreground">Average score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}