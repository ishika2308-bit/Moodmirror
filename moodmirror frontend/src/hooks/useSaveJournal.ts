import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
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
      const saveFn = httpsCallable<
        { text: string; analysis: AnalysisResult; isPrimaryForDay: boolean }, 
        { success: boolean }
      >(functions, 'saveJournalEntry');
      
      const result = await saveFn({ text, analysis, isPrimaryForDay });
      return result.data.success;
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
