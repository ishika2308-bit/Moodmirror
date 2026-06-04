import { useState } from 'react';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp, writeBatch, runTransaction } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { AnalysisResult } from '../types';

export function useSaveJournal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveJournal = async (
    text: string, 
    analysis: AnalysisResult, 
    isPrimaryForDay: boolean = false
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Authentication required");
      }
      const uid = user.uid;

      const batch = writeBatch(db);
      
      const entryRef = doc(collection(db, 'journal_entries'));
      const reportRef = doc(db, 'analysis_reports', entryRef.id);
      const profileRef = doc(db, 'mood_profiles', uid);

      if (isPrimaryForDay) {
        // Fetch recent entries to unset primary flag
        const recentQ = query(
          collection(db, 'journal_entries'),
          where("userId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const recentEntries = await getDocs(recentQ);
        recentEntries.docs.forEach(d => {
          if (d.data().isPrimaryForDay === true) {
            batch.update(d.ref, { isPrimaryForDay: false });
          }
        });
      }

      batch.set(entryRef, {
        entryId: entryRef.id,
        userId: uid,
        encryptedJournal: text, // No real AES encryption here in client
        wordCount: text.split(/\s+/).length,
        isPrimaryForDay: isPrimaryForDay || false,
        createdAt: serverTimestamp(),
      });

      batch.set(reportRef, {
        entryId: entryRef.id,
        userId: uid,
        ...analysis,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      // Update Mood Profile transactionally
      await runTransaction(db, async (tx) => {
        const docSnap = await tx.get(profileRef);
        const current = docSnap.exists()
          ? docSnap.data() as any
          : { optimism: 50, resilience: 50, consistency: 50, entryCount: 0 };

        const alpha = 0.3;
        const n = current.entryCount;

        const optimism = n === 0 ? analysis.positivity : Math.round(alpha * analysis.positivity + (1 - alpha) * current.optimism);
        
        const baseResilience = Math.min(100, Math.max(0, 50 + ((analysis.strengths?.length || 0) * 10) - ((analysis.concerns?.length || 0) * 10)));
        const resilience = n === 0 ? baseResilience : Math.round(alpha * baseResilience + (1 - alpha) * current.resilience);
        
        const variance = Math.abs(analysis.moodScore - (current.consistency ?? 50));
        const consistencyScore = Math.max(0, 100 - variance);
        const consistency = n === 0 ? consistencyScore : Math.round(alpha * consistencyScore + (1 - alpha) * current.consistency);

        tx.set(
          profileRef,
          { 
            optimism, 
            resilience, 
            consistency, 
            entryCount: n + 1,
            lastUpdated: serverTimestamp() 
          },
          { merge: true }
        );
      });

      return true;
    } catch (err: any) {
      console.error('Error saving journal:', err);
      setError(err.message || 'Failed to save journal');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { saveJournal, isLoading, error };
}
