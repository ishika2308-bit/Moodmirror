import { useState } from 'react';
import { analyzeReflectionClient } from '../lib/geminiService';
import { useSaveJournal } from './useSaveJournal';
import { useAuth } from '../context/AuthContext';
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
  const { userProfile, currentUser } = useAuth();

  const submitJournal = async (text: string): Promise<SubmitJournalResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const companionName = userProfile?.companionName || 'Mira';
      const userName = currentUser?.displayName?.split(' ')[0] || 'there';
      const reflectionTone = userProfile?.preferences?.reflectionTone || 'Supportive';
      
      // 1. Analyze text via Gemini Client with companion context
      const analysis = await analyzeReflectionClient(text, { companionName, userName, reflectionTone });
      
      // We do NOT save here. We pass the analysis to ReflectionView so the user can choose
      // to "Add To Today's Story" or "Keep in Reflection Vault".
      
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
