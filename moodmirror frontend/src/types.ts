export type ViewState = 'reflection' | 'journal' | 'patterns' | 'archive' | 'self';
export type EmotionState = 'hopeful' | 'calm' | 'reflective' | 'excited' | 'stressed' | 'neutral';
export type MirrorState = 'idle' | 'listening' | 'processing' | 'reflecting';

export interface Entry {
  id: string;
  text: string;
  date: Date;
}

export interface AnalysisResult {
  primaryEmotion: string;
  secondaryEmotion: string;
  reflection: string;
  recommendation: string;
  summary: string;
  emotionalDrivers: string[];
  strengths: string[];
  concerns: string[];
  stressLevel: number;
  positivity: number;
  energy: number;
  focus: number;
  moodScore: number;
  moodGrade: string;
  moodLabel: string;
}
