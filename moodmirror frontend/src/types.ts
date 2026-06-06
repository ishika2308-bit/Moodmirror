export type ViewState = 'home' | 'patterns' | 'archive' | 'self';
export type EmotionState = 'hopeful' | 'calm' | 'reflective' | 'excited' | 'stressed' | 'neutral';
export type MirrorState = 'idle' | 'listening' | 'processing' | 'reflecting';

export interface PhotoAttachment {
  id: string;
  type: 'photo' | 'screenshot' | 'meme';
  storage: {
    url: string;
    storagePath: string;
  };
  presentation: {
    style: 'polaroid' | 'sticky-note' | 'scrapbook' | 'memory-pin';
    caption?: string;
  };
  metadata: {
    width: number;
    height: number;
    createdAt: Date;
    
    // Future AI
    aiTags?: string[];
    aiContext?: string;
    aiEmotion?: string;
    aiDescription?: string;

    // Future Memory Engine
    peopleDetected?: string[];
    locationName?: string;
    memoryImportance?: number;
  };
}

export interface Entry {
  id: string;
  text: string;
  date: Date;
  attachments?: PhotoAttachment[];
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
  scoreBreakdown?: {
    positivity: number;
    focus: number;
    energy: number;
    stressPenalty: number;
    burnoutPenalty: number;
  };
  linkedGoalIds?: string[];
  attachments?: PhotoAttachment[];
  analysisStatus?: 'pending' | 'completed' | 'failed';
}

export interface Goal {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: any;
  lastLinkedAt?: any;
}
