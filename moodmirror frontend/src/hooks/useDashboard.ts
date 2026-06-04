import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { AnalysisResult } from '../types';

export interface MoodProfile {
  optimism: number;
  resilience: number;
  consistency: number;
  entryCount: number;
  primaryDrivers?: string[];
  lastUpdated?: string;
}

export interface DashboardEntry {
  id: string;
  date: string;
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
  stats?: {
    totalEntries: number;
    averageMoodScore: number;
    recentScores: number[];
  };
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
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication required");
      const uid = user.uid;

      // 1. Fetch Profile
      const profileSnap = await getDoc(doc(db, 'mood_profiles', uid));
      const profileData = profileSnap.exists() ? profileSnap.data() as MoodProfile : null;

      // 2. Fetch Analysis Reports (for scores and analysis)
      const reportsQ = query(
        collection(db, 'analysis_reports'),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const reportsSnap = await getDocs(reportsQ);
      const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Fetch Journal Entries (for the raw text)
      const entriesQ = query(
        collection(db, 'journal_entries'),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const entriesSnap = await getDocs(entriesQ);
      const entryTexts = new Map<string, string>();
      entriesSnap.docs.forEach(d => {
        entryTexts.set(d.id, d.data().encryptedJournal); // No actual encryption client-side
      });

      // 4. Fetch Weekly Reports
      const weeklyQ = query(
        collection(db, 'weekly_reports'),
        where("userId", "==", uid),
        orderBy("weekStart", "desc"),
        limit(1)
      );
      const weeklySnap = await getDocs(weeklyQ);
      const latestWeekly = weeklySnap.empty ? undefined : { id: weeklySnap.docs[0].id, ...weeklySnap.docs[0].data() } as any;

      // Assemble
      const scores = reports.map((r: any) => r.moodScore as number).filter(Boolean);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const recentEntries: DashboardEntry[] = reports.map((r: any) => ({
        id: r.id,
        date: r.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        text: entryTexts.get(r.id) || "",
        analysis: r as AnalysisResult
      }));

      setData({
        stats: {
          totalEntries: profileData?.entryCount || 0,
          averageMoodScore: avgScore,
          recentScores: scores.slice(0, 7)
        },
        moodProfile: profileData || undefined,
        recentEntries,
        latestWeeklyReport: latestWeekly
      });

    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // We can use an auth observer here, but since the app handles auth state at a higher level,
    // we assume the user is present when this hook mounts.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDashboard();
      } else {
        setData(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return { data, isLoading, error, refetch: fetchDashboard };
}
