import { useState } from 'react';
import type { AnalysisResult } from '../types';
import { analyzeReflectionClient } from '../lib/geminiService';

export function useAnalyzeReflection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeReflection = async (text: string): Promise<{ analysis: AnalysisResult } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeReflectionClient(text);
      return { analysis: result };
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
