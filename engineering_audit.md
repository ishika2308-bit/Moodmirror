# MoodMirror AI - Production Readiness Engineering Audit

## 1. Priority Issues

### Missing Retries on Gemini API Calls
**Severity:** High
**Problem:** The `analyzeEmotions` function in `geminiProcessor.ts` calls the Gemini API without any retry logic. If the API returns a transient error (e.g., 503 Unavailable, 429 Too Many Requests), the function immediately throws, and the user's journal submission fails.
**Impact:** Direct impact on user experience. Users will lose their journal entries if a transient network error or Gemini rate limit occurs.
**Fix:** Implement an exponential backoff retry mechanism around `model.generateContent(prompt)`. 

### Unsafe JSON Parsing from Gemini
**Severity:** High
**Problem:** In `geminiProcessor.ts`, the response from Gemini is parsed using `JSON.parse(cleaned) as EmotionAnalysis`. While some fields are clamped, fields like `positivity` could be parsed as `undefined` or `null` if Gemini hallucinates a missing field. Calling `Number(undefined)` yields `NaN`, which breaks the `calculateMoodScore` math in `emotionAnalyzer.ts`.
**Impact:** Firestore will store `NaN` for mood scores, breaking dashboard charts and weekly aggregates.
**Fix:** Use a runtime validation library like Zod to strictly parse and validate the Gemini JSON output, or provide strict default fallbacks (e.g., `Number(parsed.positivity) || 0`) for every expected field before returning.

### Sequential Processing in Weekly Reports
**Severity:** Medium
**Problem:** `weeklyReportGenerator.ts` processes every user's weekly report sequentially in a `for...of` loop.
**Impact:** As the user base grows, this loop will eventually exceed the 9-minute Cloud Function timeout, causing reports for users at the end of the list to never generate.
**Fix:** Process users in concurrent batches using `Promise.all` with a concurrency limit (e.g., chunks of 10 users at a time). For true scalability, consider fan-out using Cloud Tasks.

### Weak PII Token Hashing
**Severity:** Medium
**Problem:** In `tokenizer.ts`, the hash used to replace PII is truncated to 6 characters: `.slice(0, 6)`. This provides only ~16.7 million combinations.
**Impact:** While the token map is encrypted, if an attacker gains access to both the database and the `TOKENIZER_SECRET`, they could easily dictionary-attack or brute-force the 6-character hashes to reveal common names or locations.
**Fix:** Increase the slice length to at least 16 characters in `makeToken`: `.slice(0, 16)`.

### Unused AES_IV_SECRET Configuration
**Severity:** Low
**Problem:** The environment variable `AES_IV_SECRET` is defined in `.env.example`, validated in `aesEncryption.ts`, and injected into Cloud Functions via Secrets. However, it is **never used**. `aesEncryption.ts` correctly uses `crypto.randomBytes(IV_LENGTH)` to generate a secure, random IV for each encryption operation.
**Impact:** Developer confusion and unnecessary secret management overhead.
**Fix:** Remove `AES_IV_SECRET` from `.env.example`, the `validateEncryptionConfig` function, and the `secrets` array in both `submitJournal.ts` and `getDashboard.ts`.

### Dead Code in Firestore Rules
**Severity:** Low
**Problem:** In `firestore.rules`, there is a helper function `isValidNewEntry()` that is defined but never called.
**Impact:** Cluttered security rules.
**Fix:** Remove the `isValidNewEntry()` function from `firestore.rules`.

---

## 2. Quick Wins

1.  **Remove `AES_IV_SECRET`**: Clean up unused secrets across the codebase to simplify deployment and configuration.
2.  **Increase Hash Length**: Change `.slice(0, 6)` to `.slice(0, 16)` in `tokenizer.ts` (1 line change).
3.  **Add NaN Checks**: In `geminiProcessor.ts`, ensure `clamp` falls back to 0 if the value is NaN. E.g., `const val = Number(v); return isNaN(val) ? 0 : Math.max(0, ...)`
4.  **Remove Dead Rule**: Delete `isValidNewEntry()` from `firestore.rules`.

---

## 3. Production Readiness Score
**Score: 78/100**

**Justification:** 
The core architecture is solid. Security fundamentals like Firestore Rules, AES-256-GCM encryption, and tokenization are implemented correctly. However, it loses points primarily on resilience (lack of API retries) and scalability (sequential weekly report generation). Fixing the high-priority issues will push this into the 90s.

---

## 4. Final Recommendations

*   **Resilience**: Introduce `p-retry` or a custom backoff wrapper for Gemini calls.
*   **Validation**: Add strict parsing to the Gemini output layer to protect the database from LLM hallucinations.
*   **Scalability**: Refactor the weekly report cron job to process users concurrently in batches to avoid timeout limits as the app grows.
