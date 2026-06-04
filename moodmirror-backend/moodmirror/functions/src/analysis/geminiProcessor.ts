import { GoogleGenerativeAI } from "@google/generative-ai";

export interface DailyIntelligenceAnalysis {
  primaryEmotion: string;
  secondaryEmotion: string;
  stressLevel: number;
  positivity: number;
  energy: number;
  focus: number;
  emotionalDrivers: string[];
  strengths: string[];
  concerns: string[];
  reflection: string;
  recommendation: string;
  summary: string;
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

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Execute a Gemini prompt with exponential backoff retries.
 */
async function callGeminiWithRetry(model: any, prompt: string, maxRetries = 3): Promise<string> {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(`Gemini API call failed after ${maxRetries} attempts: ${(err as Error).message}`);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  return "";
}

/**
 * Send tokenized journal text to Gemini for emotion analysis.
 * Only receives tokenized text — no raw PII reaches this function.
 */
export async function analyzeEmotions(tokenizedText: string): Promise<DailyIntelligenceAnalysis> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.3,       // Low temp for consistent JSON output
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const prompt = EMOTION_PROMPT(tokenizedText);
  const rawText = await callGeminiWithRetry(model, prompt);

  // Strip markdown fences if present
  const cleaned = rawText.replace(/^```json\n?|\n?```$/g, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  // Ensure parsed is an object to prevent runtime TypeError on null/undefined
  const parsedObj = (typeof parsed === "object" && parsed !== null) ? parsed : {};

  // Strict clamp to 0-100, handles NaN / undefined gracefully
  const clamp = (v: unknown): number => {
    const num = Number(v);
    return isNaN(num) ? 0 : Math.max(0, Math.min(100, Math.round(num)));
  };

  return {
    primaryEmotion: String(parsedObj.primaryEmotion || "").slice(0, 100),
    secondaryEmotion: String(parsedObj.secondaryEmotion || "").slice(0, 100),
    stressLevel: clamp(parsedObj.stressLevel),
    positivity: clamp(parsedObj.positivity),
    energy: clamp(parsedObj.energy),
    focus: clamp(parsedObj.focus),
    emotionalDrivers: Array.isArray(parsedObj.emotionalDrivers) ? parsedObj.emotionalDrivers.map(String).slice(0, 5) : [],
    strengths: Array.isArray(parsedObj.strengths) ? parsedObj.strengths.map(String).slice(0, 5) : [],
    concerns: Array.isArray(parsedObj.concerns) ? parsedObj.concerns.map(String).slice(0, 5) : [],
    reflection: String(parsedObj.reflection || "").slice(0, 1000),
    recommendation: String(parsedObj.recommendation || "").slice(0, 1000),
    summary: String(parsedObj.summary || "").slice(0, 500),
  };
}

export interface WeeklyIntelligenceAnalysis {
  weeklyTheme: string;
  dominantPatterns: string[];
  improvements: string[];
  risks: string[];
  reflectionLetter: string;
  wellbeingStatus: string;
  recommendations: string[];
}

/**
 * Generate a weekly summary prompt for batch analysis.
 */
export async function generateWeeklySummary(
  entrySummaries: string[],
  moodScores: number[]
): Promise<WeeklyIntelligenceAnalysis> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.5, maxOutputTokens: 1500, responseMimeType: "application/json" },
  });

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

  const rawText = await callGeminiWithRetry(model, prompt);
  const cleaned = rawText.replace(/^```json\n?|\n?```$/g, "").trim();
  
  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Graceful fallback if completely unparseable
  }

  const parsedObj = (typeof parsed === "object" && parsed !== null) ? parsed : {};

  return {
    weeklyTheme: String(parsedObj.weeklyTheme || "").slice(0, 200),
    dominantPatterns: Array.isArray(parsedObj.dominantPatterns) ? parsedObj.dominantPatterns.map(String).slice(0, 5) : [],
    improvements: Array.isArray(parsedObj.improvements) ? parsedObj.improvements.map(String).slice(0, 5) : [],
    risks: Array.isArray(parsedObj.risks) ? parsedObj.risks.map(String).slice(0, 5) : [],
    reflectionLetter: String(parsedObj.reflectionLetter || "").slice(0, 2000),
    wellbeingStatus: String(parsedObj.wellbeingStatus || "").slice(0, 100),
    recommendations: Array.isArray(parsedObj.recommendations) ? parsedObj.recommendations.map(String).slice(0, 5) : [],
  };
}
