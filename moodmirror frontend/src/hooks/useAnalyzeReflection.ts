import { useState } from 'react';
import type { AnalysisResult } from '../types';
import { analyzeReflectionClient } from '../lib/geminiService';
import { useAuth } from '../context/AuthContext';
import { useRelatedMemories } from './useRelatedMemories';

export function useAnalyzeReflection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, currentUser } = useAuth();

  const { getCompanionContext } = useRelatedMemories();

  const analyzeReflection = async (text: string, activeGoals?: {id: string, title: string}[]): Promise<{ analysis: AnalysisResult } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const companionName = userProfile?.companionName || 'Mira';
      const userName = currentUser?.displayName?.split(' ')[0] || 'there';
      const preferredLanguage = userProfile?.preferences?.language || 'English';
      const tone = userProfile?.preferences?.reflectionTone || 'Supportive';
      const memoryContext = await getCompanionContext();
      
      const result = await analyzeReflectionClient(text, { 
        companionName, 
        userName,
        preferredLanguage,
        tone,
        activeGoals,
        ...memoryContext 
      });
      return { analysis: result };
    } catch (err: any) {
      console.error('Error analyzing reflection:', err);
      setError(err.message || 'Failed to analyze text');
      return {
        analysis: {
          primaryEmotion: 'reflective',
          secondaryEmotion: 'calm',
          reflection: "I couldn't create a full reflection right now, but your memory has been safely saved.",
          recommendation: '',
          summary: "A moment safely stored.",
          emotionalDrivers: ['unprocessed'],
          strengths: [],
          concerns: [],
          stressLevel: 50,
          positivity: 50,
          energy: 50,
          focus: 50,
          moodScore: 50,
          moodGrade: 'C',
          moodLabel: 'Neutral',
          analysisStatus: 'pending'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { analyzeReflection, isLoading, error };
}
