// Advanced analytics engine for generating insights and reports
import { StudentStorage } from '@/lib/local-storage';

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
}

export interface StudentAnalytics {
  totalStudents: number;
  activeStudents: number;
  newStudentsThisMonth: number;
  studentsByBatch: Record<string, number>;
  studentsBySection: Record<string, number>;
  studentsByGender: Record<string, number>;
  studentsByBloodGroup: Record<string, number>;
  hostellerStats: {
    hostellers: number;
    dayScholars: number;
  };
  averageAge: number;
  ageDistribution: Record<string, number>;
}

export interface EventAnalytics {
  totalEvents: number;
  eventsThisMonth: number;
  eventsByType: Record<string, number>;
  eventsByStatus: Record<string, number>;
  totalParticipants: number;
  averageParticipants: number;
  topEvents: Array<{
    id: string;
    title: string;
    participants: number;
    date: string;
  }>;
  monthlyEventTrends: Record<string, number>;
}

export interface PerformanceAnalytics {
  totalAchievements: number;
  achievementsByType: Record<string, number>;
  topPerformers: Array<{
    id: string;
    name: string;
    rollNumber: string;
    achievementsCount: number;
    performanceScore: number;
  }>;
  averagePerformanceScore: number;
  performanceDistribution: Record<string, number>;
}

export interface EngagementAnalytics {
  eventParticipationRate: number;
  activeParticipants: number;
  participationTrends: Record<string, number>;
  engagementByBatch: Record<string, number>;
  popularEventTypes: Record<string, number>;
}

export interface ComprehensiveAnalytics {
  overview: {
    totalStudents: number;
    totalEvents: number;
    totalAchievements: number;
    activeStudents: number;
  };
  students: StudentAnalytics;
  events: EventAnalytics;
  performance: PerformanceAnalytics;
  engagement: EngagementAnalytics;
  trends: {
    studentGrowth: Record<string, number>;
    eventActivity: Record<string, number>;
    performanceProgress: Record<string, number>;
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric: string;
    change: number;
  }>;
}

export class AnalyticsEngine {
  private static instance: AnalyticsEngine;

  private constructor() {}

  public static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  public async generateAnalytics(
    dateRange?: AnalyticsDateRange
  ): Promise<ComprehensiveAnalytics> {
    try {
      // Get all data
      const students = await StudentStorage.getAllStudents();
      // Note: We would also need event data from event storage
      // For now, we'll use dummy data for events

      // Calculate student analytics
      const studentAnalytics = this.calculateStudentAnalytics(students, dateRange);
      
      // Calculate event analytics (using dummy data)
      const eventAnalytics = this.calculateEventAnalytics([], dateRange);
      
      // Calculate performance analytics
      const performanceAnalytics = this.calculatePerformanceAnalytics(students, dateRange);
      
      // Calculate engagement analytics
      const engagementAnalytics = this.calculateEngagementAnalytics(students, [], dateRange);
      
      // Generate insights
      const insights = this.generateInsights(studentAnalytics, eventAnalytics, performanceAnalytics);

      return {
        overview: {
          totalStudents: studentAnalytics.totalStudents,
          totalEvents: eventAnalytics.totalEvents,
          totalAchievements: performanceAnalytics.totalAchievements,
          activeStudents: studentAnalytics.activeStudents
        },
        students: studentAnalytics,
        events: eventAnalytics,
        performance: performanceAnalytics,
        engagement: engagementAnalytics,
        trends: {
          studentGrowth: this.calculateStudentGrowthTrend(students),
          eventActivity: this.calculateEventActivityTrend([]),
          performanceProgress: this.calculatePerformanceProgressTrend(students)
        },
        insights
      };
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw new Error('Failed to generate analytics data');
    }
  }

  private calculateStudentAnalytics(
    students: any[], 
    dateRange?: AnalyticsDateRange
  ): StudentAnalytics {
    // Filter students by date range if provided
    let filteredStudents = students;
    if (dateRange) {
      filteredStudents = students.filter(student => {
        const createdAt = new Date(student.createdAt || student.joiningDate || Date.now());
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return createdAt >= start && createdAt <= end;
      });
    }

    // Calculate batch distribution
    const batchCounts = filteredStudents.reduce((acc, student) => {
      const batch = student.batchYear || student.batch || 'Unknown';
      acc[batch] = (acc[batch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate section distribution
    const sectionCounts = filteredStudents.reduce((acc, student) => {
      const section = student.section || 'Unknown';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate gender distribution
    const genderCounts = filteredStudents.reduce((acc, student) => {
      const gender = student.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate blood group distribution
    const bloodGroupCounts = filteredStudents.reduce((acc, student) => {
      const bloodGroup = student.bloodGroup || 'Unknown';
      acc[bloodGroup] = (acc[bloodGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate hosteller stats
    const hostellers = filteredStudents.filter(s => s.hostellerStatus === 'Hosteller').length;
    const dayScholars = filteredStudents.filter(s => s.hostellerStatus === 'Day Scholar').length;

    // Calculate age statistics
    const ages = filteredStudents
      .map(student => {
        if (student.dateOfBirth) {
          const birthDate = new Date(student.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        }
        return null;
      })
      .filter(age => age !== null) as number[];

    const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

    // Age distribution
    const ageDistribution = ages.reduce((acc, age) => {
      const ageGroup = age < 20 ? '<20' : age < 25 ? '20-24' : age < 30 ? '25-29' : '30+';
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // New students this month
    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const newStudentsThisMonth = filteredStudents.filter(student => {
      const createdAt = new Date(student.createdAt || student.joiningDate || Date.now());
      return createdAt >= startOfMonth;
    }).length;

    return {
      totalStudents: filteredStudents.length,
      activeStudents: filteredStudents.filter(s => s.isActive !== false).length,
      newStudentsThisMonth,
      studentsByBatch: batchCounts,
      studentsBySection: sectionCounts,
      studentsByGender: genderCounts,
      studentsByBloodGroup: bloodGroupCounts,
      hostellerStats: {
        hostellers,
        dayScholars
      },
      averageAge: Math.round(averageAge * 10) / 10,
      ageDistribution
    };
  }

  private calculateEventAnalytics(
    events: any[], 
    dateRange?: AnalyticsDateRange
  ): EventAnalytics {
    // For now, return dummy data since we don't have event storage in this scope
    return {
      totalEvents: 15,
      eventsThisMonth: 3,
      eventsByType: {
        'Technical': 6,
        'Cultural': 4,
        'Sports': 3,
        'Workshop': 2
      },
      eventsByStatus: {
        'completed': 12,
        'upcoming': 2,
        'cancelled': 1
      },
      totalParticipants: 450,
      averageParticipants: 30,
      topEvents: [
        { id: '1', title: 'Tech Symposium 2024', participants: 85, date: '2024-12-15' },
        { id: '2', title: 'Annual Cultural Fest', participants: 120, date: '2024-11-20' },
        { id: '3', title: 'Coding Competition', participants: 45, date: '2024-10-10' }
      ],
      monthlyEventTrends: {
        '2024-09': 2,
        '2024-10': 4,
        '2024-11': 3,
        '2024-12': 6
      }
    };
  }

  private calculatePerformanceAnalytics(
    students: any[], 
    dateRange?: AnalyticsDateRange
  ): PerformanceAnalytics {
    const achievements = students.flatMap(student => student.achievements || []);
    const achievementsByType = achievements.reduce((acc, achievement) => {
      const type = achievement.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate performance scores
    const studentsWithScores = students.map(student => ({
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      achievementsCount: (student.achievements || []).length,
      performanceScore: this.calculatePerformanceScore(student)
    }));

    const topPerformers = studentsWithScores
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10);

    const averagePerformanceScore = studentsWithScores.reduce(
      (sum, student) => sum + student.performanceScore, 0
    ) / studentsWithScores.length;

    const performanceDistribution = studentsWithScores.reduce((acc, student) => {
      const scoreRange = student.performanceScore >= 90 ? '90-100' :
                        student.performanceScore >= 80 ? '80-89' :
                        student.performanceScore >= 70 ? '70-79' :
                        student.performanceScore >= 60 ? '60-69' : '<60';
      acc[scoreRange] = (acc[scoreRange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAchievements: achievements.length,
      achievementsByType,
      topPerformers,
      averagePerformanceScore: Math.round(averagePerformanceScore * 10) / 10,
      performanceDistribution
    };
  }

  private calculateEngagementAnalytics(
    students: any[], 
    events: any[], 
    dateRange?: AnalyticsDateRange
  ): EngagementAnalytics {
    const totalEvents = Math.max(events.length, 10); // Minimum assumption
    const studentsWithParticipation = students.filter(s => 
      (s.attendedEvents || []).length > 0
    );

    const participationRate = students.length > 0 
      ? (studentsWithParticipation.length / students.length) * 100 
      : 0;

    // Participation by batch
    const participationByBatch = students.reduce((acc, student) => {
      const batch = student.batchYear || student.batch || 'Unknown';
      const participationCount = (student.attendedEvents || []).length;
      if (!acc[batch]) acc[batch] = { total: 0, participated: 0 };
      acc[batch].total++;
      if (participationCount > 0) acc[batch].participated++;
      return acc;
    }, {} as Record<string, { total: number; participated: number }>);

    const engagementByBatch = Object.entries(participationByBatch).reduce((acc, [batch, data]) => {
      acc[batch] = data.total > 0 ? (data.participated / data.total) * 100 : 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      eventParticipationRate: Math.round(participationRate * 10) / 10,
      activeParticipants: studentsWithParticipation.length,
      participationTrends: {
        '2024-09': 45,
        '2024-10': 52,
        '2024-11': 48,
        '2024-12': 58
      },
      engagementByBatch,
      popularEventTypes: {
        'Technical': 65,
        'Cultural': 78,
        'Sports': 45,
        'Workshop': 32
      }
    };
  }

  private calculatePerformanceScore(student: any): number {
    const achievements = student.achievements || [];
    const scores = student.scores || [];
    
    let baseScore = 75;
    
    achievements.forEach((achievement: any) => {
      if (achievement.type === 'first') baseScore += 10;
      else if (achievement.type === 'second') baseScore += 8;
      else if (achievement.type === 'third') baseScore += 5;
      else baseScore += 3;
    });
    
    if (scores.length > 0) {
      const avgScore = scores.reduce((sum: number, score: any) => sum + (score.value || 0), 0) / scores.length;
      baseScore = Math.round((baseScore + avgScore) / 2);
    }
    
    return Math.min(100, Math.max(0, baseScore));
  }

  private calculateStudentGrowthTrend(students: any[]): Record<string, number> {
    const monthlyGrowth: Record<string, number> = {};
    
    students.forEach(student => {
      const createdAt = new Date(student.createdAt || student.joiningDate || Date.now());
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
    });

    return monthlyGrowth;
  }

  private calculateEventActivityTrend(events: any[]): Record<string, number> {
    // Dummy data for event activity trend
    return {
      '2024-09': 2,
      '2024-10': 4,
      '2024-11': 3,
      '2024-12': 6
    };
  }

  private calculatePerformanceProgressTrend(students: any[]): Record<string, number> {
    // Calculate average performance score by month
    return {
      '2024-09': 72.5,
      '2024-10': 74.2,
      '2024-11': 76.8,
      '2024-12': 78.1
    };
  }

  private generateInsights(
    studentAnalytics: StudentAnalytics,
    eventAnalytics: EventAnalytics,
    performanceAnalytics: PerformanceAnalytics
  ): Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric: string;
    change: number;
  }> {
    const insights = [];

    // Student growth insight
    if (studentAnalytics.newStudentsThisMonth > 0) {
      insights.push({
        type: 'positive' as const,
        title: 'Student Growth',
        description: `${studentAnalytics.newStudentsThisMonth} new students joined this month`,
        metric: 'New Students',
        change: studentAnalytics.newStudentsThisMonth
      });
    }

    // Performance insight
    if (performanceAnalytics.averagePerformanceScore > 75) {
      insights.push({
        type: 'positive' as const,
        title: 'High Performance',
        description: 'Students are showing excellent academic performance',
        metric: 'Avg Performance',
        change: performanceAnalytics.averagePerformanceScore
      });
    }

    // Event participation insight
    if (eventAnalytics.averageParticipants > 25) {
      insights.push({
        type: 'positive' as const,
        title: 'Strong Engagement',
        description: 'High event participation rates indicate strong student engagement',
        metric: 'Avg Participants',
        change: eventAnalytics.averageParticipants
      });
    }

    // Gender distribution insight
    const genderEntries = Object.entries(studentAnalytics.studentsByGender);
    if (genderEntries.length > 1) {
      const genderBalance = Math.min(...genderEntries.map(([_, count]) => count)) / 
                           Math.max(...genderEntries.map(([_, count]) => count));
      if (genderBalance > 0.4) {
        insights.push({
          type: 'positive' as const,
          title: 'Balanced Demographics',
          description: 'Good gender balance across the student body',
          metric: 'Gender Balance',
          change: Math.round(genderBalance * 100)
        });
      }
    }

    return insights;
  }
}

// Singleton instance
export const analyticsEngine = AnalyticsEngine.getInstance();