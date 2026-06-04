import { GoogleGenAI } from '@google/genai';
import type { AnalysisResult } from '../types';

// The old backend used gemini-1.5-flash
const GEMINI_MODEL = 'gemini-flash-latest';

// Note: The new @google/genai SDK requires initialization this way
let ai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY is missing from environment variables');
      throw new Error('Missing Gemini API Key');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const EMOTION_PROMPT = (text: string): string => `
You are an emotional intelligence system acting as a thoughtful reflection engine.
Analyze the journal entry below and return ONLY a valid JSON object. No markdown, no explanation.

Journal entry:
"""
${text}
"""

Return this exact JSON schema (all numbers 0–100):
{
  "primaryEmotion": "<core emotion>",
  "secondaryEmotion": "<secondary emotion>",
  "stressLevel": <number>,
  "positivity": <number>,
  "energy": <number>,
  "focus": <number>,
  "emotionalDrivers": ["<driver1>", "<driver2>"],
  "strengths": ["<strength1>", "<strength2>"],
  "concerns": ["<concern1>", "<concern2>"],
  "reflection": "<one meaningful, empathetic observation>",
  "recommendation": "<one practical, highly contextual suggestion>",
  "summary": "<one sentence summary of the entry>"
}

Rules for analysis:
- Focus on UNDERSTANDING causes, not just classifying mood.
- emotionalDrivers: Identify WHY they feel this way (e.g. "academic pressure", "loneliness", "progress").
- strengths: Identify resilience indicators (e.g. "optimism despite stress", "problem solving").
- concerns: Identify burnout indicators or negative patterns.
- reflection: Do not just state the obvious. Provide deep contextual understanding.
- recommendation: Provide practical, supportive advice connected directly to their entry.
`;

function calculateMoodScore(analysis: any) {
  const positivityContrib = analysis.positivity * 0.35;
  const focusContrib = analysis.focus * 0.25;
  const energyContrib = analysis.energy * 0.20;
  
  const burnoutRisk = Math.min(100, analysis.stressLevel * 0.5 + (analysis.concerns?.length || 0) * 15);
  
  const stressPenalty = analysis.stressLevel * 0.10;
  const burnoutPenalty = burnoutRisk * 0.10;

  const raw = positivityContrib + focusContrib + energyContrib - stressPenalty - burnoutPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let grade = "F";
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";

  let label = "Critical";
  if (score >= 85) label = "Thriving";
  else if (score >= 70) label = "Balanced";
  else if (score >= 55) label = "Steady";
  else if (score >= 40) label = "Struggling";

  return {
    score,
    grade,
    label,
    breakdown: {
      positivity: Math.round(positivityContrib),
      focus: Math.round(focusContrib),
      energy: Math.round(energyContrib),
      stressPenalty: Math.round(stressPenalty),
      burnoutPenalty: Math.round(burnoutPenalty),
    },
  };
}

export async function analyzeReflectionClient(text: string): Promise<AnalysisResult> {
  const ai = getGenAI();
  const prompt = EMOTION_PROMPT(text);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      }
    });

    const rawText = response.text || '';
    const cleaned = rawText.replace(/^```json\n?|\n?```$/g, "").trim();
    
    const parsed = JSON.parse(cleaned);
    
    const clamp = (v: any) => {
      const num = Number(v);
      return isNaN(num) ? 0 : Math.max(0, Math.min(100, Math.round(num)));
    };

    const analysisObj = {
      primaryEmotion: String(parsed.primaryEmotion || "").slice(0, 100),
      secondaryEmotion: String(parsed.secondaryEmotion || "").slice(0, 100),
      stressLevel: clamp(parsed.stressLevel),
      positivity: clamp(parsed.positivity),
      energy: clamp(parsed.energy),
      focus: clamp(parsed.focus),
      emotionalDrivers: Array.isArray(parsed.emotionalDrivers) ? parsed.emotionalDrivers.map(String).slice(0, 5) : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 5) : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.map(String).slice(0, 5) : [],
      reflection: String(parsed.reflection || "").slice(0, 1000),
      recommendation: String(parsed.recommendation || "").slice(0, 1000),
      summary: String(parsed.summary || "").slice(0, 500),
    };

    const moodScoreResult = calculateMoodScore(analysisObj);

    return {
      ...analysisObj,
      moodScore: moodScoreResult.score,
      moodGrade: moodScoreResult.grade,
      moodLabel: moodScoreResult.label,
      scoreBreakdown: moodScoreResult.breakdown,
    };
  } catch (err) {
    console.error("Gemini processing failed locally:", err);
    throw new Error("Emotion analysis failed.");
  }
}

export async function analyzeWeeklyClient(entrySummaries: string[], moodScores: number[]) {
  const ai = getGenAI();
  const avgScore = moodScores.length
    ? Math.round(moodScores.reduce((a, b) => a + b, 0) / moodScores.length)
    : 50;

  const prompt = `
You are an emotional intelligence system. Perform a longitudinal analysis on the last 7 days of journals.
Recognize trends, burnout patterns, and personal growth. Return ONLY valid JSON.

Entry summaries this week:
${entrySummaries.map((s, i) => `Day ${i + 1}: ${s}`).join("\n")}

Average Mood Intelligence Score: ${avgScore}/100

Return this exact JSON schema:
{
  "weeklyTheme": "<1 sentence overarching theme>",
  "dominantPatterns": ["<pattern1>", "<pattern2>"],
  "improvements": ["<improvement1>"],
  "risks": ["<risk1>"],
  "reflectionLetter": "<A short, compassionate paragraph summarizing their week and emotional trajectory>",
  "wellbeingStatus": "<Safe/Concerning/Thriving - identify sustained exhaustion or positive trends>",
  "recommendations": ["<practical long-term recommendation>"]
}

Rules:
- Identify if there is sustained sadness, exhaustion, or burnout.
- Surface concerns compassionately. Never diagnose or claim mental illness.
- Focus on emotional trajectory over the week.
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      }
    });

    const rawText = response.text || '';
    const cleaned = rawText.replace(/^```json\n?|\n?```$/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      weeklyTheme: String(parsed.weeklyTheme || "").slice(0, 200),
      dominantPatterns: Array.isArray(parsed.dominantPatterns) ? parsed.dominantPatterns.map(String).slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String).slice(0, 5) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).slice(0, 5) : [],
      reflectionLetter: String(parsed.reflectionLetter || "").slice(0, 2000),
      wellbeingStatus: String(parsed.wellbeingStatus || "").slice(0, 100),
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String).slice(0, 5) : [],
    };
  } catch (err) {
    console.error("Weekly Gemini processing failed locally:", err);
    throw new Error("Weekly analysis failed.");
  }
}
