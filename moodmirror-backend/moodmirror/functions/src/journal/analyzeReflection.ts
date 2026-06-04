import * as functions from "firebase-functions";
import { checkRateLimit } from "../middleware/rateLimiter";
import { validateJournalText } from "./piiDetector";
import { tokenize } from "./tokenizer";
import { analyzeEmotions } from "../analysis/geminiProcessor";
import { calculateMoodScore } from "../analysis/emotionAnalyzer";

interface AnalyzeReflectionRequest {
  text: string;
}

export const analyzeReflection = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
    secrets: ["GEMINI_API_KEY", "TOKENIZER_SECRET"],
  })
  .https.onCall(async (data: AnalyzeReflectionRequest, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;

    // 2. Validate input
    const validation = validateJournalText(data.text);
    if (!validation.valid) {
      throw new functions.https.HttpsError("invalid-argument", validation.reason ?? "Invalid input");
    }

    // 3. Rate limit check
    const rateLimit = await checkRateLimit(uid, "analyzeReflection");
    if (!rateLimit.allowed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Rate limit exceeded. Try again at ${rateLimit.resetAt.toISOString()}`
      );
    }

    // 4. Tokenize for Gemini
    const { tokenizedText } = tokenize(data.text);

    // 5. Gemini analysis
    let emotionAnalysis;
    try {
      emotionAnalysis = await analyzeEmotions(tokenizedText);
    } catch (err) {
      functions.logger.error("Gemini processing failed", { uid, error: (err as Error).message });
      throw new functions.https.HttpsError("internal", "Emotion analysis failed.");
    }

    // 6. Calculate Mood Score
    const moodScoreResult = calculateMoodScore(emotionAnalysis);

    return {
      success: true,
      analysis: {
        primaryEmotion: emotionAnalysis.primaryEmotion,
        secondaryEmotion: emotionAnalysis.secondaryEmotion,
        stressLevel: emotionAnalysis.stressLevel,
        positivity: emotionAnalysis.positivity,
        focus: emotionAnalysis.focus,
        energy: emotionAnalysis.energy,
        emotionalDrivers: emotionAnalysis.emotionalDrivers,
        strengths: emotionAnalysis.strengths,
        concerns: emotionAnalysis.concerns,
        reflection: emotionAnalysis.reflection,
        recommendation: emotionAnalysis.recommendation,
        summary: emotionAnalysis.summary,
        moodScore: moodScoreResult.score,
        moodGrade: moodScoreResult.grade,
        moodLabel: moodScoreResult.label,
        scoreBreakdown: moodScoreResult.breakdown,
      }
    };
  });
