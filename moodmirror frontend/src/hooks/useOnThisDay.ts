import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateOnThisDayReflection } from '../lib/geminiService';

export interface OnThisDayMemory {
  id: string;
  yearDiff: number;
  originalDate: Date;
  text: string;
  analysis: any;
  then: string[];
  now: string[];
  companionReflection: string;
}

export function useOnThisDay() {
  const { currentUser, userProfile } = useAuth();
  const [memory, setMemory] = useState<OnThisDayMemory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMemory = async () => {
      if (!currentUser || !userProfile) return;

      const uid = currentUser.uid;
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const cacheKey = `on_this_day_${uid}_${todayStr}`;

      try {
        // 1. Check Cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.id === 'mock-1-year-ago') {
            localStorage.removeItem(cacheKey);
          } else {
            // Rehydrate Date object
            parsed.originalDate = new Date(parsed.originalDate);
            if (isMounted) {
              setMemory(parsed);
              setIsLoading(false);
            }
            return;
          }
        }

        // 2. Fetch Historical Memories (1 to 10 years ago)
        const memoryCandidates: any[] = [];
        
        try {
          for (let i = 1; i <= 10; i++) {
            const targetYear = today.getFullYear() - i;
            const start = new Date(targetYear, today.getMonth(), today.getDate(), 0, 0, 0);
            const end = new Date(targetYear, today.getMonth(), today.getDate(), 23, 59, 59, 999);

            const q = query(
              collection(db, 'journal_entries'),
              where('userId', '==', uid),
              where('createdAt', '>=', Timestamp.fromDate(start)),
              where('createdAt', '<=', Timestamp.fromDate(end))
            );

            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              // Also fetch analysis
              for (const docSnap of snapshot.docs) {
                const entryData = docSnap.data();
                const analysisSnap = await getDoc(doc(db, 'analysis_reports', docSnap.id));
                
                const type = entryData.isTimeCapsule ? 'time_capsule' : 
                             entryData.isDayStory ? 'day_story' : 
                             !entryData.isTemporary ? 'journal' : 'reflection';

                // Significance Score
                let score = 0;
                if (entryData.wordCount) score += entryData.wordCount;
                if (analysisSnap.exists()) {
                  const aData = analysisSnap.data();
                  if (aData.primaryEmotion) score += 50; // Has analysis
                  if (aData.emotionalDrivers?.length) score += aData.emotionalDrivers.length * 10;
                }
                if (type === 'time_capsule') score += 10000;
                if (type === 'day_story') score += 5000;
                if (type === 'journal') score += 1000;

                memoryCandidates.push({
                  id: docSnap.id,
                  yearDiff: i,
                  originalDate: entryData.createdAt.toDate(),
                  text: entryData.encryptedJournal || entryData.text || '',
                  analysis: analysisSnap.exists() ? analysisSnap.data() : null,
                  type,
                  score
                });
              }
            }
          }
        } catch (queryErr) {
          console.warn("Firestore index missing for journal_entries. Proceeding to mock.", queryErr);
        }

        if (memoryCandidates.length === 0) {
          // No historical memories found.
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // 3. Pick the most significant memory
        memoryCandidates.sort((a, b) => b.score - a.score);
        const bestMemory = memoryCandidates[0];

        // 4. Fetch "Now" context
        const profileSnap = await getDoc(doc(db, 'mood_profiles', uid));
        const currentProfile = profileSnap.exists() ? profileSnap.data() : null;

        const recentQ = query(
          collection(db, 'analysis_reports'),
          where('userId', '==', uid)
        );
        
        let recentAnalyses: any[] = [];
        try {
          const recentSnap = await getDocs(recentQ);
          // Sort manually to avoid needing a Firestore composite index
          recentAnalyses = recentSnap.docs
            .map(d => d.data())
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
            .slice(0, 5);
        } catch (e) {
          console.warn("Could not fetch recent analyses, continuing without them.", e);
        }

        // 5. Generate Reflection via Gemini
        const companionName = userProfile.companionName || 'Mira';
        const userName = currentUser.displayName?.split(' ')[0] || 'there';
        
        const reflectionData = await generateOnThisDayReflection(
          companionName,
          userName,
          bestMemory.text,
          bestMemory.analysis,
          currentProfile,
          recentAnalyses
        );

        const finalMemory: OnThisDayMemory = {
          id: bestMemory.id,
          yearDiff: bestMemory.yearDiff,
          originalDate: bestMemory.originalDate,
          text: bestMemory.text,
          analysis: bestMemory.analysis,
          then: reflectionData.then || [],
          now: reflectionData.now || [],
          companionReflection: reflectionData.companionReflection
        };

        // Cache it
        localStorage.setItem(cacheKey, JSON.stringify(finalMemory));

        if (isMounted) {
          setMemory(finalMemory);
          setIsLoading(false);
        }

      } catch (err) {
        console.error('Error fetching On This Day memory:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMemory();

    return () => {
      isMounted = false;
    };
  }, [currentUser, userProfile]);

  return { memory, isLoading };
}
