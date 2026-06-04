import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();

// Collection references
export const Collections = {
  USERS: "users",
  JOURNAL_ENTRIES: "journal_entries",
  ANALYSIS_REPORTS: "analysis_reports",
  WEEKLY_REPORTS: "weekly_reports",
  MOOD_PROFILES: "mood_profiles",
  RATE_LIMITS: "rate_limits",
} as const;

// Firestore field value helpers
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
