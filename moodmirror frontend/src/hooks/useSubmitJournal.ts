import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { AnalysisResult } from '../types';

interface SubmitJournalResponse {
  entryId: string;
  analysisReportId?: string;
  moodProfileId?: string;
  analysis?: AnalysisResult;
}

export function useSubmitJournal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitJournal = async (text: string): Promise<SubmitJournalResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const submitFn = httpsCallable<{ text: string, source?: string }, SubmitJournalResponse>(functions, 'submitJournal');
      const result = await submitFn({ text, source: 'voice' });
      return result.data;
    } catch (err: any) {
      console.error('Error submitting journal:', err);
      setError(err.message || 'Failed to submit journal');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitJournal, isLoading, error };
}
