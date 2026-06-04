import { db, Collections, FieldValue, Timestamp } from "../config/firebaseAdmin";

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX ?? "10", 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and increment rate limit for a user.
 * Uses Firestore transactions for atomic counters.
 * Window resets after RATE_LIMIT_WINDOW_MS milliseconds.
 */
export async function checkRateLimit(userId: string, action: string): Promise<RateLimitResult> {
  const key = `${userId}_${action}`;
  const docRef = db.collection(Collections.RATE_LIMITS).doc(key);
  const now = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    const windowStart = now - WINDOW_MS;
    const resetAt = new Date(now + WINDOW_MS);

    if (!doc.exists) {
      // First request — create window
      tx.set(docRef, {
        userId,
        action,
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
    }

    const data = doc.data()!;
    const windowStartTs = data.windowStart?.toMillis() ?? 0;

    if (windowStartTs < windowStart) {
      // Window expired — reset
      tx.set(docRef, {
        userId,
        action,
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
    }

    const count: number = data.count ?? 0;

    if (count >= MAX_REQUESTS) {
      const expiresAt = new Date(windowStartTs + WINDOW_MS);
      return { allowed: false, remaining: 0, resetAt: expiresAt };
    }

    // Increment counter
    tx.update(docRef, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { allowed: true, remaining: MAX_REQUESTS - count - 1, resetAt };
  });

  return result;
}
