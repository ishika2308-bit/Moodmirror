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

export interface MemoryProfileData {
  people?: Record<string, any>;
  topics?: Record<string, number>;
  goals?: string[];
  emotions?: Record<string, number>;
  milestones?: Record<string, boolean>;
  metrics?: Record<string, number>;
}

export interface MemoryArtifact {
  id: string;
  type: string;
  title: string;
  description: string;
  importanceScore?: number;
  createdAt?: any;
}

export interface DashboardData {
  stats?: {
    totalEntries: number;
    averageMoodScore: number;
    recentScores: number[];
  };
  moodProfile?: MoodProfile;
  memoryProfile?: MemoryProfileData;
  memoryArtifacts?: MemoryArtifact[];
  recentEntries: DashboardEntry[];
  latestWeeklyReport?: WeeklyReport;
}

// ─── Client-side Extractors and Generators ───────────────────────────────────

function extractPeople(text: string): string[] {
  const nameRegex = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b/g;
  const matches = text.match(nameRegex) || [];
  const commonStopwords = new Set([
    "I", "Today", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    "The", "A", "An", "My", "He", "She", "They", "It", "We", "You", "This", "That", "But", "If", "And", "In", "On", "At", "To",
    "Firebase", "React", "Google", "Apple", "Amazon", "Microsoft", "Javascript", "Typescript", "Node", "App", "Website",
    "Yesterday", "Tomorrow", "Morning", "Afternoon", "Evening", "Night", "So", "Then", "Because", "When", "While", "Where",
    "There", "Here", "Why", "How", "What", "Who"
  ]);
  const people = new Set<string>();
  for (const match of matches) {
    if (!commonStopwords.has(match)) {
      people.add(match);
    }
  }
  return Array.from(people);
}

function generateClientSideMemoryData(recentEntries: DashboardEntry[], profileData: MoodProfile | null) {
  const people: Record<string, any> = {};
  const topics: Record<string, number> = {};
  const emotions: Record<string, number> = {};
  const milestones: Record<string, boolean> = {
    firstReflection: false,
    firstTimeCapsule: false,
    firstPhoto: false,
    firstCompanionMemory: false,
    streak7Days: false,
    streak30Days: false
  };
  const goals: string[] = [];
  const memoryArtifacts: MemoryArtifact[] = [];

  // Sort entries oldest first to build stats & milestones chronologically
  const sortedEntries = [...recentEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedEntries.forEach((entry, idx) => {
    const text = entry.text || "";
    const analysis = entry.analysis;
    const moodScore = analysis?.moodScore ?? 50;
    const emotion = analysis?.primaryEmotion ?? "Reflective";
    const date = new Date(entry.date);

    // Increment emotions
    emotions[emotion] = (emotions[emotion] || 0) + 1;
    
    // Check for photos to boost importance
    const hasPhotos = analysis?.attachments && analysis.attachments.length > 0;

    // Extract people
    const entryPeople = extractPeople(text);
    entryPeople.forEach(p => {
      if (!people[p]) {
        people[p] = {
          name: p,
          mentionCount: 0,
          averageMood: 0,
          commonEmotions: {},
          emotionTrend: [],
          relationshipImportance: 0,
          lastMentioned: entry.date
        };
      }
      const rel = people[p];
      rel.averageMood = ((rel.averageMood * rel.mentionCount) + moodScore) / (rel.mentionCount + 1);
      rel.mentionCount += 1;
      rel.commonEmotions[emotion] = (rel.commonEmotions[emotion] || 0) + 1;
      rel.lastMentioned = entry.date;
      
      // Calculate base importance, then add a significant bonus for memories with photos
      const baseImportance = Math.round(rel.mentionCount * (rel.averageMood / 50));
      rel.relationshipImportance = hasPhotos ? baseImportance + 25 : baseImportance;
      
      rel.emotionTrend.push(emotion);
      if (rel.emotionTrend.length > 5) {
        rel.emotionTrend.shift();
      }

      // Check relationship milestones
      if (rel.mentionCount === 5 || rel.mentionCount === 10 || rel.mentionCount === 25) {
        memoryArtifacts.unshift({
          id: `client-rel-${p}-${rel.mentionCount}`,
          type: "relationship_milestone",
          title: `Bond Milestone: ${p}`,
          description: `You have shared reflections involving ${p} across ${rel.mentionCount} entries.`,
          importanceScore: 40 + Math.min(40, rel.mentionCount),
          createdAt: { toDate: () => date }
        });
      }
    });

    // Check generic milestones
    if (idx === 0 && !milestones.firstReflection) {
      milestones.firstReflection = true;
      memoryArtifacts.unshift({
        id: "client-ms-first-ref",
        type: "first_reflection",
        title: "First Reflection",
        description: "You took your very first step in capturing your emotional journey.",
        importanceScore: 50,
        createdAt: { toDate: () => date }
      });
    }

    if (analysis?.reflection && !milestones.firstCompanionMemory) {
      milestones.firstCompanionMemory = true;
      memoryArtifacts.unshift({
        id: "client-ms-first-comp",
        type: "first_companion_memory",
        title: "First Companion Insight",
        description: "Received your first companion feedback observing your day.",
        importanceScore: 55,
        createdAt: { toDate: () => date }
      });
    }
  });

  const memoryProfileData: MemoryProfileData = {
    people,
    topics,
    goals,
    emotions,
    milestones,
    metrics: {
      totalEntries: sortedEntries.length,
      totalCapsules: 0,
      totalPhotos: 0,
      currentStreak: sortedEntries.length > 0 ? 1 : 0
    }
  };

  return { memoryProfileData, memoryArtifacts };
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
        limit(60)
      );
      const reportsSnap = await getDocs(reportsQ);
      const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Fetch Journal Entries (for the raw text)
      const entriesQ = query(
        collection(db, 'journal_entries'),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(60)
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

      // Assemble entries first so they are available for client-side generation
      const recentEntries: DashboardEntry[] = reports.map((r: any) => ({
        id: r.id,
        date: r.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        text: entryTexts.get(r.id) || "",
        analysis: r as AnalysisResult
      }));

      // 5. Fetch Memory Profile (Phase 2 Architecture)
      let memoryProfileData: MemoryProfileData | undefined = undefined;
      let memoryArtifacts: MemoryArtifact[] = [];
      
      try {
        const memoryProfileSnap = await getDoc(doc(db, 'users', uid, 'memory_profile', 'main'));
        memoryProfileData = memoryProfileSnap.exists() ? memoryProfileSnap.data() as MemoryProfileData : undefined;

        // 6. Fetch Memory Artifacts (Milestones)
        const artifactsQ = query(
          collection(db, 'users', uid, 'memory_artifacts'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const artifactsSnap = await getDocs(artifactsQ);
        memoryArtifacts = artifactsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MemoryArtifact));
      } catch (e) {
        console.warn("Failed to fetch Phase 2 memory data (permissions might not be deployed yet)", e);
      }

      // Client-side fallback if no data returned from Firestore
      if (!memoryProfileData || !memoryProfileData.people || Object.keys(memoryProfileData.people).length === 0) {
        console.log("Generating client-side memory profile and artifacts...");
        const fallback = generateClientSideMemoryData(recentEntries, profileData);
        memoryProfileData = fallback.memoryProfileData;
        if (memoryArtifacts.length === 0) {
          memoryArtifacts = fallback.memoryArtifacts;
        }
      }

      // Assemble
      const scores = reports.map((r: any) => r.moodScore as number).filter(Boolean);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setData({
        stats: {
          totalEntries: profileData?.entryCount || 0,
          averageMoodScore: avgScore,
          recentScores: scores.slice(0, 7)
        },
        moodProfile: profileData || undefined,
        memoryProfile: memoryProfileData,
        memoryArtifacts,
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
