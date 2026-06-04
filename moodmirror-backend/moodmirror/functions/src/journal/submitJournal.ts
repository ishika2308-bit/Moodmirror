import * as functions from "firebase-functions";
import { db, Collections, FieldValue } from "../config/firebaseAdmin";
import { detectPII, validateJournalText } from "./piiDetector";
import { tokenize } from "./tokenizer";
import { analyzeEmotions } from "../analysis/geminiProcessor";
import { calculateMoodScore, updateMoodProfile } from "../analysis/emotionAnalyzer";
import { encrypt, encryptObject } from "../encryption/aesEncryption";
import { checkRateLimit } from "../middleware/rateLimiter";

interface SubmitJournalRequest {
  text: string;
  mood?: string; // Optional user-provided mood tag
  tags?: string[];
}

/**
 * HTTPS Callable: Submit a journal entry.
 * Full pipeline: validate → rate-limit → PII detect → tokenize → Gemini → encrypt → store
 */
export const submitJournal = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
    secrets: ["GEMINI_API_KEY", "AES_ENCRYPTION_KEY", "AES_IV_SECRET", "TOKENIZER_SECRET"],
  })
  .https.onCall(async (data: SubmitJournalRequest, context) => {
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
    const rateLimit = await checkRateLimit(uid, "submitJournal");
    if (!rateLimit.allowed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Rate limit exceeded. Try again at ${rateLimit.resetAt.toISOString()}`
      );
    }

    // 4. PII Detection (log for audit, don't block)
    const piiResult = detectPII(data.text);
    if (piiResult.hasPII) {
      functions.logger.info(`PII detected for user ${uid}`, {
        types: piiResult.types,
        count: piiResult.count,
      });
    }

    // 5. Tokenize PII
    const { tokenizedText, tokenMap, tokenCount } = tokenize(data.text);
    functions.logger.info(`Tokenized ${tokenCount} PII tokens for user ${uid}`);

    // 6. Gemini emotion analysis (on tokenized text only)
    let emotionAnalysis;
    try {
      emotionAnalysis = await analyzeEmotions(tokenizedText);
    } catch (err) {
      functions.logger.error("Gemini processing failed", { uid, error: (err as Error).message });
      throw new functions.https.HttpsError("internal", "Emotion analysis failed. Please try again.");
    }

    // 7. Calculate Mood Intelligence Score
    const moodScoreResult = calculateMoodScore(emotionAnalysis);

    // 8. Encrypt journal (original text) and token map
    const encryptedJournal = encrypt(data.text);
    const encryptedTokenMap = encryptObject(tokenMap);

    // 9. Batch write to Firestore
    const batch = db.batch();
    const entryRef = db.collection(Collections.JOURNAL_ENTRIES).doc();
    const reportRef = db.collection(Collections.ANALYSIS_REPORTS).doc(entryRef.id);
    const profileRef = db.collection(Collections.MOOD_PROFILES).doc(uid);

    // Journal entry (encrypted)
    batch.set(entryRef, {
      entryId: entryRef.id,
      userId: uid,
      encryptedJournal,
      encryptedTokenMap,
      piiDetected: piiResult.hasPII,
      piiTypes: piiResult.types,
      wordCount: data.text.split(/\s+/).length,
      userMood: data.mood ?? null,
      userTags: data.tags ?? [],
      createdAt: FieldValue.serverTimestamp(),
    });

    // Analysis report (not encrypted — contains only AI-derived metadata, no raw PII)
    batch.set(reportRef, {
      entryId: entryRef.id,
      userId: uid,
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
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 10. Update mood profile (outside batch for read-modify-write)
    await updateMoodProfileDoc(uid, profileRef, emotionAnalysis, moodScoreResult.score);

    functions.logger.info(`Journal submitted successfully`, { uid, entryId: entryRef.id, score: moodScoreResult.score });

    return {
      success: true,
      entryId: entryRef.id,
      moodScore: moodScoreResult.score,
      moodGrade: moodScoreResult.grade,
      moodLabel: moodScoreResult.label,
      primaryEmotion: emotionAnalysis.primaryEmotion,
      secondaryEmotion: emotionAnalysis.secondaryEmotion,
      reflection: emotionAnalysis.reflection,
      recommendation: emotionAnalysis.recommendation,
    };
  });

async function updateMoodProfileDoc(
  uid: string,
  profileRef: FirebaseFirestore.DocumentReference,
  analysis: ReturnType<typeof analyzeEmotions> extends Promise<infer T> ? T : never,
  newScore: number
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(profileRef);
    const current = doc.exists
      ? (doc.data() as { optimism: number; resilience: number; consistency: number; entryCount: number })
      : { optimism: 50, resilience: 50, consistency: 50, entryCount: 0 };

    const updated = updateMoodProfile(current, analysis, newScore);

    tx.set(
      profileRef,
      { ...updated, lastUpdated: FieldValue.serverTimestamp() },
      { merge: true }
    );
  });
}
