import { useState, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CompanionContext } from '../lib/geminiService';

export interface RelatedMemory {
  id: string;
  entryId: string;
  connections: {
    people: string[];
    topics: string[];
  };
  metrics: {
    importanceScore: number;
    emotionIntensity: number;
    hasPhotos: boolean;
    savedToStory: boolean;
  };
  createdAt: any;
}

export function useRelatedMemories() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCompanionContext = useCallback(async (): Promise<Partial<CompanionContext>> => {
    if (!currentUser) return {};
    if (currentUser.uid === 'dev-user-123') return {};
    
    
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch top memories
      const graphRef = collection(db, 'users', currentUser.uid, 'memory_graph');
      const q = query(graphRef, orderBy('metrics.importanceScore', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      
      const memories: RelatedMemory[] = [];
      querySnapshot.forEach((d) => {
        memories.push({ id: d.id, ...d.data() } as RelatedMemory);
      });

      // 2. Fetch memory profile
      const profileRef = doc(db, 'users', currentUser.uid, 'memory_profile', 'main');
      const profileSnap = await getDoc(profileRef);
      const profile = profileSnap.exists() ? profileSnap.data() : null;

      let recurringTopics: string[] = [];
      let recurringPeople: string[] = [];
      let activeGoals: { id: string; title: string }[] = [];

      if (profile) {
        if (profile.topics) {
          recurringTopics = Object.entries(profile.topics)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
        }
        if (profile.people) {
          recurringPeople = Object.entries(profile.people)
            .sort((a: any, b: any) => b[1].mentionCount - a[1].mentionCount)
            .slice(0, 5)
            .map(([name]) => name);
        }
        if (profile.goals) {
          activeGoals = Array.isArray(profile.goals) ? profile.goals.slice(0, 5) : [];
        }
      }

      return {
        relatedMemories: memories,
        recurringTopics,
        recurringPeople,
        activeGoals
      };
    } catch (err) {
      console.error('Error fetching companion context:', err);
      setError(err as Error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return {
    getCompanionContext,
    loading,
    error
  };
}
