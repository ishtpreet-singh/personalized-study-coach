import { apiClient } from './client';
import type { Subject } from '../types/subject';

export interface DashboardActivity {
  id: string;
  title: string;
  context: string;
  timestamp: string;
  type: 'upload' | 'quiz' | 'study' | 'mastery';
}

export interface DashboardPlanItem {
  id: string;
  label: string;
  subject: string;
  tag: string;
}

export interface SubjectStats {
  document_count: number;
  quiz_count: number;
  mastery: number;
  weak_topic_count: number;
  last_studied_at: string | null;
}

export interface SubjectWithStats extends Subject {
  stats: SubjectStats;
}

export interface DashboardData {
  study_streak: number;
  todayGoal: string;
  estimatedStudyTimeMins: number;
  nextRevision: string;
  overallMastery: number;
  plan: DashboardPlanItem[];
  recentActivity: DashboardActivity[];
  subjects: SubjectWithStats[];
}

export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    const { data } = await apiClient.get<DashboardData>('/api/v1/dashboard/metrics');
    return data;
  }
};
