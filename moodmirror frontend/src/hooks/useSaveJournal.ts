import { useState } from 'react';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp, writeBatch, runTransaction, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { determinePhotoType, determinePresentationStyle } from '../utils/photoUtils';
import type { AnalysisResult, PhotoAttachment } from '../types';

export type SaveMode = 'story' | 'vault' | 'capsule';

export function useSaveJournal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save a journal entry either as part of "Today's Story" (permanent)
   * or into the "Reflection Vault" (temporary, expires in 10 days).
   */
  const saveJournal = async (
    text: string,
    analysis: AnalysisResult,
    mode: SaveMode = 'story',
    capsuleDays?: number,
    photos?: File[]
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required');
      const uid = user.uid;

      const isTemporary = mode === 'vault';
      const isCapsule = mode === 'capsule';
      // Vault reflections expire in 10 days
      const expiresAt = isTemporary
        ? Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000))
        : null;
        
      const unlockAt = isCapsule && capsuleDays
        ? Timestamp.fromDate(new Date(Date.now() + capsuleDays * 24 * 60 * 60 * 1000))
        : null;

      const batch = writeBatch(db);

      const entryRef = doc(collection(db, 'journal_entries'));
      const reportRef = doc(db, 'analysis_reports', entryRef.id);
      const profileRef = doc(db, 'mood_profiles', uid);

      // Upload photos if provided
      const attachments: PhotoAttachment[] = [];
      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          let url = URL.createObjectURL(file);
          let storagePath = `mock-path-${Date.now()}`;

          if (uid !== 'dev-user-123') {
            storagePath = `users/${uid}/memories/${entryRef.id}/${file.name}-${Date.now()}`;
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, file);
            url = await getDownloadURL(fileRef);
          }

          // Get image dimensions
          const dimensions = await Promise.race([
            new Promise<{width: number, height: number}>((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ width: img.width, height: img.height });
              img.onerror = () => resolve({ width: 0, height: 0 });
              img.src = URL.createObjectURL(file);
            }),
            new Promise<{width: number, height: number}>((resolve) => setTimeout(() => resolve({ width: 800, height: 600 }), 2000))
          ]);

          const type = determinePhotoType(file.type);
          const isImportant = (analysis.moodScore && (analysis.moodScore > 80 || analysis.moodScore < 20)) || false;
          
          attachments.push({
            id: `attachment-${Date.now()}-${i}`,
            type,
            storage: { url, storagePath },
            presentation: {
              style: determinePresentationStyle(file.type, isImportant),
            },
            metadata: {
              width: dimensions.width,
              height: dimensions.height,
              createdAt: new Date(),
            }
          });
        }
      }

      batch.set(entryRef, {
        entryId: entryRef.id,
        userId: uid,
        encryptedJournal: text,
        wordCount: text.split(/\s+/).length,
        isTemporary,
        isCapsule,
        unlockAt,
        expiresAt: expiresAt ?? null,
        createdAt: serverTimestamp(),
        attachments: attachments.length > 0 ? attachments : null,
      });

      batch.set(reportRef, {
        entryId: entryRef.id,
        userId: uid,
        ...analysis,
        attachments: attachments.length > 0 ? attachments : null,
        isTemporary,
        isCapsule,
        unlockAt,
        expiresAt: expiresAt ?? null,
        createdAt: serverTimestamp(),
      });

      if (uid !== 'dev-user-123') {
        await batch.commit();

        // Only update mood profile for permanent story entries (not vault, not capsule until unlocked)
        if (mode === 'story') {
          await runTransaction(db, async (tx) => {
          const docSnap = await tx.get(profileRef);
          const current = docSnap.exists()
            ? (docSnap.data() as any)
            : { optimism: 50, resilience: 50, consistency: 50, entryCount: 0 };

          const alpha = 0.3;
          const n = current.entryCount;
          const optimism =
            n === 0 ? analysis.positivity : Math.round(alpha * analysis.positivity + (1 - alpha) * current.optimism);
          const baseResilience = Math.min(
            100,
            Math.max(0, 50 + (analysis.strengths?.length || 0) * 10 - (analysis.concerns?.length || 0) * 10)
          );
          const resilience =
            n === 0 ? baseResilience : Math.round(alpha * baseResilience + (1 - alpha) * current.resilience);
          const variance = Math.abs(analysis.moodScore - (current.consistency ?? 50));
          const consistencyScore = Math.max(0, 100 - variance);
          const consistency =
            n === 0 ? consistencyScore : Math.round(alpha * consistencyScore + (1 - alpha) * current.consistency);

          tx.set(
            profileRef,
            { optimism, resilience, consistency, entryCount: n + 1, lastUpdated: serverTimestamp() },
            { merge: true }
          );
        });
        }
      }

      return entryRef.id;
    } catch (err: any) {
      console.error('Error saving journal:', err);
      setError(err.message || 'Failed to save journal');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Promote a vault entry to a permanent story entry.
   * Clears isTemporary and expiresAt flags.
   */
  const promoteToStory = async (entryId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required');

      const entryRef = doc(db, 'journal_entries', entryId);
      const reportRef = doc(db, 'analysis_reports', entryId);

      const batch = writeBatch(db);
      batch.update(entryRef, { isTemporary: false, expiresAt: null });
      batch.update(reportRef, { isTemporary: false, expiresAt: null });
      await batch.commit();

      return true;
    } catch (err: any) {
      console.error('Error promoting entry:', err);
      setError(err.message || 'Failed to promote reflection');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { saveJournal, promoteToStory, isLoading, error };
}
