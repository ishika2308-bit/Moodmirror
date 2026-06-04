import * as functions from "firebase-functions";
import { db, Collections, FieldValue, Timestamp } from "../config/firebaseAdmin";
import { generateWeeklySummary } from "../analysis/geminiProcessor";
import { aggregateWeeklyScore } from "../analysis/emotionAnalyzer";

/**
 * Scheduled function: Runs every Sunday at midnight UTC.
 * Generates weekly reports for all users who journaled in the past 7 days.
 */
export const generateWeeklyReports = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes — process many users
    memory: "1GB",
    secrets: ["GEMINI_API_KEY"],
  })
  .pubsub.schedule("0 0 * * 0") // Every Sunday at 00:00 UTC
  .timeZone("UTC")
  .onRun(async (_context) => {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStartTs = Timestamp.fromDate(weekStart);

    functions.logger.info("Starting weekly report generation", { weekStart: weekStart.toISOString() });

    // Find all analysis reports from the past week
    const reportsSnap = await db
      .collection(Collections.ANALYSIS_REPORTS)
      .where("createdAt", ">=", weekStartTs)
      .get();

    if (reportsSnap.empty) {
      functions.logger.info("No entries found for the past week");
      return;
    }

    // Group reports by userId
    const userReports: Record<string, FirebaseFirestore.DocumentData[]> = {};
    reportsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!userReports[data.userId]) userReports[data.userId] = [];
      userReports[data.userId].push(data);
    });

    const userIds = Object.keys(userReports);
    functions.logger.info(`Processing weekly reports for ${userIds.length} users in batches`);

    // Process in concurrent batches to balance speed and rate limits
    const CONCURRENCY_LIMIT = 5; 

    for (let i = 0; i < userIds.length; i += CONCURRENCY_LIMIT) {
      const batchIds = userIds.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(
        batchIds.map(async (userId) => {
          const entries = userReports[userId];
          try {
            await processUserWeeklyReport(userId, entries, weekStart, now);
          } catch (err) {
            functions.logger.error(`Failed weekly report for user ${userId}`, {
              error: (err as Error).message,
            });
            // Continue processing other users in the batch
          }
        })
      );
    }

    functions.logger.info("Weekly report generation complete");
  });

async function processUserWeeklyReport(
  userId: string,
  entries: FirebaseFirestore.DocumentData[],
  weekStart: Date,
  weekEnd: Date
): Promise<void> {
  const summaries = entries.map((e) => e.summary as string).filter(Boolean);
  const moodScores = entries.map((e) => e.moodScore as number).filter(Boolean);
  const allEmotions = entries
    .map((e) => e.primaryEmotion as string)
    .concat(entries.map((e) => e.secondaryEmotion as string))
    .filter(Boolean);
  const allDrivers = entries.flatMap((e) => (e.emotionalDrivers as string[]) || []);

  // Aggregate stats
  const weeklyScore = aggregateWeeklyScore(moodScores);
  const avgStress = Math.round(
    entries.reduce((sum, e) => sum + ((e.stressLevel as number) ?? 0), 0) / (entries.length || 1)
  );

  // Top emotions & drivers by frequency
  const emotionFreq = countFrequency(allEmotions);
  const driverFreq = countFrequency(allDrivers);
  const topEmotions = Object.entries(emotionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([e]) => e);
  const topDrivers = Object.entries(driverFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  // Generate Gemini weekly narrative
  const geminiSummary = await generateWeeklySummary(summaries, moodScores);

  // Write weekly report
  const reportRef = db
    .collection(Collections.WEEKLY_REPORTS)
    .doc(`${userId}_${weekStart.toISOString().split("T")[0]}`);

  await reportRef.set({
    userId,
    weekStart: Timestamp.fromDate(weekStart),
    weekEnd: Timestamp.fromDate(weekEnd),
    entryCount: entries.length,
    averageMoodScore: weeklyScore,
    averageStress: avgStress,
    topEmotions,
    topDrivers,
    weeklyTheme: geminiSummary.weeklyTheme,
    dominantPatterns: geminiSummary.dominantPatterns,
    improvements: geminiSummary.improvements,
    risks: geminiSummary.risks,
    reflectionLetter: geminiSummary.reflectionLetter,
    wellbeingStatus: geminiSummary.wellbeingStatus,
    recommendations: geminiSummary.recommendations,
    generatedAt: FieldValue.serverTimestamp(),
  });

  functions.logger.info(`Weekly report written for user ${userId}`, {
    weeklyScore,
    entryCount: entries.length,
  });
}

function countFrequency(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}
