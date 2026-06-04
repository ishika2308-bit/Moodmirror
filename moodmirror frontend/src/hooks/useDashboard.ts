import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { AnalysisResult } from '../types';

export interface MoodProfile {
  optimism: number;
  resilience: number;
  consistency: number;
  primaryDrivers: string[];
  lastUpdated: string;
}

export interface DashboardEntry {
  id: string;
  date: string; // ISO string
  text: string;
  analysis?: AnalysisResult;
}

export interface WeeklyReport {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  letter: string;
  recommendations: string[];
}

export interface DashboardData {
  moodProfile?: MoodProfile;
  recentEntries: DashboardEntry[];
  latestWeeklyReport?: WeeklyReport;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const getDashboardFn = httpsCallable<void, DashboardData>(functions, 'getDashboard');
      const result = await getDashboardFn();
      setData(result.data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return { data, isLoading, error, refetch: fetchDashboard };
}
