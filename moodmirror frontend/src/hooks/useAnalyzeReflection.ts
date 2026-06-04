import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { AnalysisResult } from '../types';

export function useAnalyzeReflection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeReflection = async (text: string): Promise<{ analysis: AnalysisResult } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const analyzeFn = httpsCallable<{ text: string }, { success: boolean; analysis: AnalysisResult }>(
        functions,
        'analyzeReflection'
      );
      const result = await analyzeFn({ text });
      return result.data;
    } catch (err: any) {
      console.error('Error analyzing reflection:', err);
      setError(err.message || 'Failed to analyze text');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { analyzeReflection, isLoading, error };
}
