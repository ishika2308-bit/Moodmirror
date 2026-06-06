import { aiManager } from './ai/AIManager';
import { auth } from './firebase';
import type { AnalysisResult } from '../types';

export interface CompanionContext {
  companionName?: string;
  userName?: string;
  reflectionTone?: string;
  preferredLanguage?: string;
  relatedMemories?: any[];
  recurringTopics?: string[];
  recurringPeople?: string[];
  activeGoals?: { id: string; title: string }[];
}

const EMOTION_PROMPT = (text: string, companionName: string, userName: string, reflectionTone: string, preferredLanguage: string, ctx?: CompanionContext): string => `
You are ${companionName}, a warm and caring reflection companion — not a therapist, not an analyst. You're a trusted friend who listens deeply and responds with genuine empathy.

The user's name is ${userName || 'there'}.

Their preferred communication language is: ${preferredLanguage}. 
You MUST respond (specifically in the "reflection", "recommendation", and "summary" fields) in ${preferredLanguage}. If they use Hinglish (a mix of Hindi and English), respond naturally in conversational Hinglish. If they write in English, respond in English. Match their fluency and style.


They have just shared this with you:
"""
${text}
"""

${ctx?.relatedMemories?.length ? `--- MEMORY CONTEXT ---
You remember these past important themes and people from their life:
Recent Topics: ${ctx.recurringTopics?.join(', ') || 'None'}
Frequent People: ${ctx.recurringPeople?.join(', ') || 'None'}
Active Goals: ${ctx.activeGoals?.map(g => `[ID: ${g.id}] ${g.title}`).join(', ') || 'None'}

When responding, you may weave in a subtle connection to this context if it feels natural (e.g., "You've described similar feelings before around your work..."). Do not force it.
` : ''}

Your job is to understand them deeply and respond like a close friend who truly gets it.

Your designated reflection tone is: ${reflectionTone}. 
- If Gentle: focus heavily on validation and comfort.
- If Direct: be honest, concise, and tell them exactly what they need to hear, kindly.
- If Supportive: act as their biggest cheerleader, focusing on their strengths.
- If Analytical: help them connect the dots of WHY they feel this way, but maintain a warm, human touch.

Also review the "Active Goals" list. If the user's reflection demonstrates clear progress, effort, or relevance toward any of those goals, include their IDs in the \`linkedGoalIds\` array. If no goals are relevant, return an empty array.

Return ONLY a valid JSON object. No markdown, no explanation.

Return this exact JSON schema (all numeric fields are 0–100):
{
  "primaryEmotion": "<core emotion in 1-2 words>",
  "secondaryEmotion": "<secondary emotion in 1-2 words>",
  "stressLevel": <number>,
  "positivity": <number>,
  "energy": <number>,
  "focus": <number>,
  "emotionalDrivers": ["<theme1>", "<theme2>", "<theme3>"],
  "strengths": ["<strength1>", "<strength2>"],
  "concerns": ["<concern1>"],
  "linkedGoalIds": ["<goalId1>", "<goalId2>"],
  "reflection": "<Your companion message — warm, personal, conversational. Start with 'Hey ${userName || 'there'},' and write 3-4 sentences as a caring friend. Be specific to what they shared. Never use clinical language. Never sound like a report. Sound like a trusted friend who just listened carefully.>",
  "recommendation": "<One gentle, practical suggestion. Keep it caring and specific to their situation. 1-2 sentences max.>",
  "summary": "<One warm sentence summarizing their day — as if you're telling a mutual friend how ${userName || 'they'} was doing today.>"
}

Rules:
- reflection MUST start with "Hey ${userName || 'there'}," 
- reflection MUST feel like a message from a friend, not a clinical observation
- reflection MUST embody the ${reflectionTone} tone.
- Never use words like: "clinically", "indicators", "analysis", "assessment", "metrics"
- emotionalDrivers: identify WHY they feel this way (e.g. "long hours", "creative breakthrough", "missing someone")
- Be encouraging but honest — don't be falsely positive
- Specific details from their entry should appear in the reflection
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
    score, grade, label,
    breakdown: {
      positivity: Math.round(positivityContrib),
      focus: Math.round(focusContrib),
      energy: Math.round(energyContrib),
      stressPenalty: Math.round(stressPenalty),
      burnoutPenalty: Math.round(burnoutPenalty),
    },
  };
}

export async function analyzeReflectionClient(text: string, ctx?: CompanionContext): Promise<AnalysisResult> {
  const companionName = ctx?.companionName || 'Mira';
  const userName = ctx?.userName || 'there';
  const reflectionTone = ctx?.reflectionTone || 'Supportive';
  const preferredLanguage = ctx?.preferredLanguage || 'English';
  const prompt = EMOTION_PROMPT(text, companionName, userName, reflectionTone, preferredLanguage, ctx);

  try {
    const parsed = await aiManager.generateJSON<any>(prompt, undefined, {
      temperature: 0.4,
      useCache: false,
      featureSource: 'Reflection'
    });

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
      linkedGoalIds: Array.isArray(parsed.linkedGoalIds) ? parsed.linkedGoalIds.map(String) : [],
      reflection: String(parsed.reflection || "").slice(0, 1500),
      recommendation: String(parsed.recommendation || "").slice(0, 500),
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
    console.error("AI processing failed locally:", err);
    throw new Error("Emotion analysis failed.");
  }
}


export async function analyzeWeeklyClient(entrySummaries: string[], moodScores: number[]) {
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
    const parsed = await aiManager.generateJSON<any>(prompt, undefined, {
      temperature: 0.5,
      useCache: true,
      featureSource: 'WeeklyReflection',
      userId: auth.currentUser?.uid
    });

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
    console.error("Weekly AI processing failed locally:", err);
    throw new Error("Weekly analysis failed.");
  }
}

export async function generateSpotifyRecommendationParams(
  emotion: string, 
  vibe: string, 
  spotifyProfile: any
) {
  const prompt = `
You are an expert music curator. 
The user is currently feeling: ${emotion}
Their current emotional vibe is: ${vibe}

Their Spotify listening profile:
Top Genres: ${spotifyProfile.topGenres?.join(', ') || 'Unknown'}
Top Artists: ${spotifyProfile.topArtists?.join(', ') || 'Unknown'}
Top Tracks: ${spotifyProfile.topTracks?.join(', ') || 'Unknown'}

Provide Spotify search parameters to find a track that matches BOTH their emotional state and their actual musical taste.
The same mood should NOT always generate the same song, so pick a specific sub-genre or energy level that fits.

Return ONLY a valid JSON object. No markdown, no explanation.

Return this exact JSON schema:
{
  "searchGenres": ["<genre1>", "<genre2>"],
  "energy": "<low, medium, or high>",
  "explanation": "<A short 2-3 sentence explanation directly to the user about why this track recommendation fits their current emotional state and their listening habits. Be highly personal.>"
}

Example explanation: "Your reflections showed optimism returning after a stressful period. Since you often listen to indie acoustic music, this track matches both your emotional state and your musical comfort zone."
`;

  try {
    const parsed = await aiManager.generateJSON<any>(prompt, undefined, {
      temperature: 0.7,
      useCache: true,
      featureSource: 'SpotifyPlaylist',
      userId: auth.currentUser?.uid
    });
    return parsed;
  } catch (err) {
    console.error("AI Spotify recommendation failed locally:", err);
    throw new Error("Spotify recommendation failed.");
  }
}

export async function generateOnThisDayReflection(
  companionName: string,
  userName: string,
  oldEntry: string,
  oldAnalysis: any,
  currentProfile: any,
  recentAnalyses: any[]
) {
  const prompt = `
You are ${companionName}, a warm and caring reflection companion.
The user's name is ${userName}.

You are presenting them with a memory they wrote exactly on this day in the past.
Your goal is to help them witness their own growth over time. Do NOT use clinical language or numbers. Focus on emotional storytelling.

--- THE PAST ---
Original Journal Entry:
"""
${oldEntry}
"""
Past Primary Emotion: ${oldAnalysis?.primaryEmotion || 'Unknown'}
Past Drivers: ${oldAnalysis?.emotionalDrivers?.join(', ') || 'Unknown'}

--- THE PRESENT ---
Current Mood Profile (Optimism: ${currentProfile?.optimism || 50}, Resilience: ${currentProfile?.resilience || 50})
Recent Primary Emotions (last few days): ${recentAnalyses.map(a => a.primaryEmotion).filter(Boolean).join(', ') || 'Unknown'}
Recent Drivers: ${recentAnalyses.flatMap(a => a.emotionalDrivers).filter(Boolean).slice(0, 5).join(', ') || 'Unknown'}

STRICT INSTRUCTION: Base their "now" state ONLY on the Current Mood Profile and Recent Primary Emotions provided above. Do not invent or guess their current state.

Return ONLY a valid JSON object. No markdown, no explanation.

Return this exact JSON schema:
{
  "then": ["<1 word emotion/state>", "<1 word emotion/state>"],
  "now": ["<1 word emotion/state derived STRICTLY from recent data>", "<1 word emotion/state derived STRICTLY from recent data>"],
  "companionReflection": "<A deeply personal, warm, storytelling reflection (3-5 sentences). Start by recalling what they felt back then, acknowledge the reality of that moment, and then bridge it to who they are right now based on their recent data. Sound like a trusted friend who has been quietly watching their journey.>"
}
`;

  try {
    const parsed = await aiManager.generateJSON<any>(prompt, undefined, {
      temperature: 0.6,
      useCache: true,
      featureSource: 'OnThisDay',
      userId: auth.currentUser?.uid
    });
    return parsed;
  } catch (err) {
    console.error("AI On This Day generation failed:", err);
    throw new Error("On This Day generation failed.");
  }
}

