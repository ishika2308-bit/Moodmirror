import * as functions from "firebase-functions";
import { db, Collections, FieldValue } from "../config/firebaseAdmin";
import { detectPII } from "./piiDetector";
import { tokenize } from "./tokenizer";
import { encrypt, encryptObject } from "../encryption/aesEncryption";
import { updateMoodProfile } from "../analysis/emotionAnalyzer";

interface SaveJournalRequest {
  text: string;
  analysis: any; // The analysis object returned from analyzeReflection
  isPrimaryForDay?: boolean;
}

export const saveJournalEntry = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
    secrets: ["AES_ENCRYPTION_KEY", "AES_IV_SECRET", "TOKENIZER_SECRET"],
  })
  .https.onCall(async (data: SaveJournalRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;

    const { text, analysis, isPrimaryForDay } = data;

    // 1. Detect and tokenize PII again for storage
    const piiResult = detectPII(text);
    const { tokenMap } = tokenize(text);

    // 2. Encrypt
    const encryptedJournal = encrypt(text);
    const encryptedTokenMap = encryptObject(tokenMap);

    // 3. Batch write
    const batch = db.batch();
    const entryRef = db.collection(Collections.JOURNAL_ENTRIES).doc();
    const reportRef = db.collection(Collections.ANALYSIS_REPORTS).doc(entryRef.id);
    const profileRef = db.collection(Collections.MOOD_PROFILES).doc(uid);

    // If making this the primary entry for today, unset previous primaries
    if (isPrimaryForDay) {
      // Fetch recent entries (last 20) and unset any primary flag for today
      // In production, you'd use a dedicated index or date field
      const recentEntries = await db.collection(Collections.JOURNAL_ENTRIES)
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();
        
      // For simplicity, we just unset any recent primary flags
      recentEntries.docs.forEach(doc => {
        if (doc.data().isPrimaryForDay === true) {
          batch.update(doc.ref, { isPrimaryForDay: false });
        }
      });
    }

    batch.set(entryRef, {
      entryId: entryRef.id,
      userId: uid,
      encryptedJournal,
      encryptedTokenMap,
      piiDetected: piiResult.hasPII,
      piiTypes: piiResult.types,
      wordCount: text.split(/\s+/).length,
      isPrimaryForDay: isPrimaryForDay || false,
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.set(reportRef, {
      entryId: entryRef.id,
      userId: uid,
      ...analysis, // Save the entire analysis object
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 4. Update Mood Profile
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(profileRef);
      const current = doc.exists
        ? (doc.data() as any)
        : { optimism: 50, resilience: 50, consistency: 50, entryCount: 0 };

      // Reconstruct the nested Gemini analysis object for the updater
      const emotionAnalysis = {
        primaryEmotion: analysis.primaryEmotion,
        secondaryEmotion: analysis.secondaryEmotion,
        stressLevel: analysis.stressLevel,
        positivity: analysis.positivity,
        focus: analysis.focus,
        energy: analysis.energy,
        emotionalDrivers: analysis.emotionalDrivers,
        strengths: analysis.strengths,
        concerns: analysis.concerns,
        reflection: analysis.reflection,
        recommendation: analysis.recommendation,
        summary: analysis.summary,
      };

      const updated = updateMoodProfile(current, emotionAnalysis, analysis.moodScore);

      tx.set(
        profileRef,
        { ...updated, lastUpdated: FieldValue.serverTimestamp() },
        { merge: true }
      );
    });

    return {
      success: true,
      entryId: entryRef.id,
    };
  });
