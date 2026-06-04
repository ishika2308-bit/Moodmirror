import { DailyIntelligenceAnalysis } from "./geminiProcessor";

export interface MoodIntelligenceScore {
  score: number;       // 0–100 composite
  grade: string;       // A–F
  label: string;       // Human-readable label
  breakdown: {
    positivity: number;
    focus: number;
    energy: number;
    stressPenalty: number;
    burnoutPenalty: number;
  };
}

/**
 * Calculate Mood Intelligence Score from emotion analysis.
 * Formula: positivity(35%) + focus(25%) + energy(20%) - stress(10%) - burnout(10%)
 * Clamped to 0–100.
 */
export function calculateMoodScore(analysis: DailyIntelligenceAnalysis): MoodIntelligenceScore {
  const positivityContrib = analysis.positivity * 0.35;
  const focusContrib = analysis.focus * 0.25;
  const energyContrib = analysis.energy * 0.20;
  
  // Calculate burnout risk internally based on concerns and stress
  const burnoutRisk = Math.min(100, analysis.stressLevel * 0.5 + analysis.concerns.length * 15);
  
  const stressPenalty = analysis.stressLevel * 0.10;
  const burnoutPenalty = burnoutRisk * 0.10;

  const raw = positivityContrib + focusContrib + energyContrib - stressPenalty - burnoutPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    grade: scoreToGrade(score),
    label: scoreToLabel(score),
    breakdown: {
      positivity: Math.round(positivityContrib),
      focus: Math.round(focusContrib),
      energy: Math.round(energyContrib),
      stressPenalty: Math.round(stressPenalty),
      burnoutPenalty: Math.round(burnoutPenalty),
    },
  };
}

function scoreToGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function scoreToLabel(score: number): string {
  if (score >= 85) return "Thriving";
  if (score >= 70) return "Balanced";
  if (score >= 55) return "Steady";
  if (score >= 40) return "Struggling";
  return "Critical";
}

/**
 * Aggregate multiple scores into a weekly average.
 */
export function aggregateWeeklyScore(scores: number[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Update a mood profile with exponential moving average.
 * alpha = 0.3 gives more weight to recent entries.
 */
export function updateMoodProfile(
  currentProfile: {
    optimism: number;
    resilience: number;
    consistency: number;
    entryCount: number;
  },
  newAnalysis: DailyIntelligenceAnalysis,
  newScore: number
): { optimism: number; resilience: number; consistency: number; entryCount: number } {
  const alpha = 0.3;
  const n = currentProfile.entryCount;

  // Optimism = rolling avg of positivity
  const optimism =
    n === 0
      ? newAnalysis.positivity
      : Math.round(alpha * newAnalysis.positivity + (1 - alpha) * currentProfile.optimism);

  // Resilience = calculated from strengths vs concerns
  const baseResilience = Math.min(100, Math.max(0, 50 + (newAnalysis.strengths.length * 10) - (newAnalysis.concerns.length * 10)));
  const resilience =
    n === 0
      ? baseResilience
      : Math.round(alpha * baseResilience + (1 - alpha) * currentProfile.resilience);

  // Consistency = how close today's score is to running average (lower variance = higher consistency)
  const variance = Math.abs(newScore - (currentProfile.consistency ?? 50));
  const consistencyScore = Math.max(0, 100 - variance);
  const consistency =
    n === 0
      ? consistencyScore
      : Math.round(alpha * consistencyScore + (1 - alpha) * currentProfile.consistency);

  return {
    optimism,
    resilience,
    consistency,
    entryCount: n + 1,
  };
}
