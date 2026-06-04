import * as functions from "firebase-functions";
import { db, Collections } from "../config/firebaseAdmin";
import { decrypt, EncryptedPayload } from "../encryption/aesEncryption";

interface DashboardQuery {
  limit?: number;
  startAfter?: string; // entryId for pagination
}

/**
 * HTTPS Callable: Get dashboard data for the authenticated user.
 * Decrypts journal entries server-side and returns them to the owner only.
 */
export const getDashboard = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
    secrets: ["AES_ENCRYPTION_KEY", "AES_IV_SECRET"],
  })
  .https.onCall(async (data: DashboardQuery, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;
    const limit = Math.min(data.limit ?? 10, 50); // Max 50 entries

    // Fetch recent analysis reports (no decryption needed — no PII stored)
    let reportsQuery = db
      .collection(Collections.ANALYSIS_REPORTS)
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit);

    const reportsSnap = await reportsQuery.get();
    const reports = reportsSnap.docs.map((doc) => ({
      entryId: doc.data().entryId,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }));

    // Fetch mood profile
    const profileSnap = await db.collection(Collections.MOOD_PROFILES).doc(uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    // Fetch recent weekly report
    const weeklySnap = await db
      .collection(Collections.WEEKLY_REPORTS)
      .where("userId", "==", uid)
      .orderBy("weekStart", "desc")
      .limit(1)
      .get();

    const latestWeekly = weeklySnap.empty ? null : weeklySnap.docs[0].data();

    // Calculate aggregate stats
    const scores = reports.map((r: any) => r.moodScore as number).filter(Boolean);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      success: true,
      userId: uid,
      stats: {
        totalEntries: profile?.entryCount ?? 0,
        averageMoodScore: avgScore,
        recentScores: scores.slice(0, 7),
      },
      moodProfile: profile
        ? {
            optimism: profile.optimism,
            resilience: profile.resilience,
            consistency: profile.consistency,
            entryCount: profile.entryCount,
          }
        : null,
      recentEntries: reports,
      latestWeeklyReport: latestWeekly,
    };
  });

/**
 * HTTPS Callable: Get a single journal entry (decrypted).
 * Only the owning user can access their own entries.
 */
export const getJournalEntry = functions
  .runWith({
    timeoutSeconds: 30,
    memory: "256MB",
    secrets: ["AES_ENCRYPTION_KEY", "AES_IV_SECRET"],
  })
  .https.onCall(async (data: { entryId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;

    if (!data.entryId) {
      throw new functions.https.HttpsError("invalid-argument", "entryId is required");
    }

    const entrySnap = await db
      .collection(Collections.JOURNAL_ENTRIES)
      .doc(data.entryId)
      .get();

    if (!entrySnap.exists) {
      throw new functions.https.HttpsError("not-found", "Journal entry not found");
    }

    const entryData = entrySnap.data()!;

    // Enforce ownership — belt-and-suspenders (Security Rules also enforce this)
    if (entryData.userId !== uid) {
      throw new functions.https.HttpsError("permission-denied", "Access denied");
    }

    // Decrypt journal text
    let decryptedText: string;
    try {
      decryptedText = decrypt(entryData.encryptedJournal as EncryptedPayload);
    } catch (err) {
      throw new functions.https.HttpsError("internal", "Failed to decrypt entry");
    }

    return {
      success: true,
      entry: {
        entryId: data.entryId,
        text: decryptedText,
        wordCount: entryData.wordCount,
        userMood: entryData.userMood,
        userTags: entryData.userTags,
        createdAt: entryData.createdAt?.toDate?.()?.toISOString() ?? null,
      },
    };
  });
