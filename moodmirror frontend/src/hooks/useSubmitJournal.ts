import { useState } from 'react';
import { analyzeReflectionClient } from '../lib/geminiService';
import { useSaveJournal } from './useSaveJournal';
import type { AnalysisResult } from '../types';

interface SubmitJournalResponse {
  entryId?: string;
  analysisReportId?: string;
  moodProfileId?: string;
  analysis?: AnalysisResult;
}

export function useSubmitJournal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { saveJournal } = useSaveJournal();

  const submitJournal = async (text: string): Promise<SubmitJournalResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Analyze text via Gemini Client
      const analysis = await analyzeReflectionClient(text);
      
      // 2. Save to Firestore (defaults to false for isPrimaryForDay in the old flow)
      const success = await saveJournal(text, analysis, false);
      
      if (!success) {
        throw new Error("Failed to save journal to database");
      }

      return { analysis };
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
