/**
 * MoodMirror AI — Firebase Cloud Functions Entry Point
 *
 * Functions exported:
 *  - onUserCreate       : Auth trigger — init user data on signup
 *  - onUserDelete       : Auth trigger — purge all user data on delete
 *  - submitJournal      : HTTPS Callable — full journal pipeline
 *  - getDashboard       : HTTPS Callable — dashboard data retrieval
 *  - getJournalEntry    : HTTPS Callable — single entry decrypt + return
 *  - generateWeeklyReports : Scheduled — weekly AI report generation
 */

// Must be first — initializes Firebase Admin
import "./config/firebaseAdmin";

// Validate encryption config at cold start
import { validateEncryptionConfig } from "./encryption/aesEncryption";
try {
  // Only validate if env vars are present (not during build)
  if (process.env.AES_ENCRYPTION_KEY) {
    validateEncryptionConfig();
  }
} catch (err) {
  console.error("[MoodMirror] Encryption config invalid:", (err as Error).message);
}

// Auth triggers
export { onUserCreate, onUserDelete } from "./auth/onUserCreate";

// Journal functions
export { submitJournal } from "./journal/submitJournal";
export { analyzeReflection } from "./journal/analyzeReflection";
export { saveJournalEntry } from "./journal/saveJournalEntry";

// Dashboard functions
export { getDashboard, getJournalEntry } from "./dashboard/getDashboard";

// Scheduled reports
export { generateWeeklyReports } from "./reports/weeklyReportGenerator";
