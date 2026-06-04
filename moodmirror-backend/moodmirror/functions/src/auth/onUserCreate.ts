import * as functions from "firebase-functions";
import { db, Collections, FieldValue } from "../config/firebaseAdmin";

/**
 * Triggered when a new user is created via Firebase Auth.
 * Creates the users document and initializes mood_profiles.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  const batch = db.batch();

  // Create user document
  const userRef = db.collection(Collections.USERS).doc(uid);
  batch.set(userRef, {
    userId: uid,
    email: email ?? null,
    displayName: displayName ?? null,
    photoURL: photoURL ?? null,
    createdAt: FieldValue.serverTimestamp(),
    preferences: {
      theme: "dark",
      notifications: true,
      weeklyReport: true,
    },
  });

  // Initialize mood profile
  const profileRef = db.collection(Collections.MOOD_PROFILES).doc(uid);
  batch.set(profileRef, {
    userId: uid,
    optimism: 50,
    resilience: 50,
    consistency: 50,
    entryCount: 0,
    lastUpdated: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  functions.logger.info(`User initialized: ${uid}`);
});

/**
 * Triggered when a user is deleted.
 * Cleans up all user data across collections.
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  const collectionsToDelete = [
    Collections.JOURNAL_ENTRIES,
    Collections.ANALYSIS_REPORTS,
    Collections.WEEKLY_REPORTS,
    Collections.MOOD_PROFILES,
  ];

  // Delete in parallel
  await Promise.allSettled(
    collectionsToDelete.map(async (col) => {
      const query = db.collection(col).where("userId", "==", uid).limit(500);
      let snapshot = await query.get();

      while (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        snapshot = await query.get();
      }
    })
  );

  // Delete user document and rate limits
  await Promise.allSettled([
    db.collection(Collections.USERS).doc(uid).delete(),
    db.collection(Collections.RATE_LIMITS).doc(`${uid}_submitJournal`).delete(),
  ]);

  functions.logger.info(`User data purged: ${uid}`);
});
