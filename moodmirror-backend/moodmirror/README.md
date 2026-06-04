# MoodMirror AI — Backend

Firebase Cloud Functions backend for MoodMirror AI.

---

## Architecture

```
User → Firebase Auth → Journal Submission → PII Detection → Tokenization
     → Gemini Processing → Emotion Analysis → AES Encryption → Firestore
     → Dashboard Retrieval → Mood Intelligence Score
```

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Blaze (pay-as-you-go) plan

---

## Setup

### 1. Clone and install

```bash
cd functions
npm install
```

### 2. Configure environment secrets

Generate keys:
```bash
# AES-256 key (64 hex chars = 32 bytes)
openssl rand -hex 32

# IV secret (32 hex chars = 16 bytes)
openssl rand -hex 16

# Tokenizer secret
openssl rand -hex 24
```

Set Firebase secrets (production):
```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set AES_ENCRYPTION_KEY
firebase functions:secrets:set AES_IV_SECRET
firebase functions:secrets:set TOKENIZER_SECRET
```

For local development, copy `.env.example` to `.env` and fill values:
```bash
cp functions/.env.example functions/.env
```

### 3. Enable Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Set it as a Firebase secret (step 2 above)

### 4. Deploy

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules
```

### 5. Local emulator

```bash
cd functions && npm run build
firebase emulators:start
```

---

## Cloud Functions

| Function | Trigger | Description |
|---|---|---|
| `onUserCreate` | Auth onCreate | Creates user doc + mood profile |
| `onUserDelete` | Auth onDelete | Purges all user data |
| `submitJournal` | HTTPS Callable | Full journal pipeline |
| `getDashboard` | HTTPS Callable | Dashboard data (decrypted) |
| `getJournalEntry` | HTTPS Callable | Single entry retrieval |
| `generateWeeklyReports` | Scheduled (Sun 00:00 UTC) | Weekly AI reports |

---

## Firestore Collections

| Collection | Description | Encrypted |
|---|---|---|
| `users` | User profile + preferences | No |
| `journal_entries` | Raw journal text | **Yes (AES-256-GCM)** |
| `analysis_reports` | Emotion analysis results | No (no PII) |
| `weekly_reports` | Weekly AI summaries | No |
| `mood_profiles` | Aggregated mood traits | No |
| `rate_limits` | Internal rate limiting | No |

---

## Security

- All journal text encrypted with AES-256-GCM before Firestore storage
- PII stripped via tokenization before reaching Gemini API
- Firestore Security Rules enforce `userId == auth.uid` on all reads
- Cloud Functions are the only write path (client cannot write directly)
- Rate limiting: 10 journal submissions per 60 seconds per user

---

## Mood Intelligence Score Formula

```
Score = positivity(35%) + focus(25%) + energy(20%) - stress(10%) - burnout(10%)
Clamped to 0–100
```

| Score | Grade | Label |
|---|---|---|
| 85–100 | A | Thriving |
| 70–84 | B | Balanced |
| 55–69 | C | Steady |
| 40–54 | D | Struggling |
| 0–39 | F | Critical |

---

## Environment Variables

| Variable | Description | How to Generate |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | Google AI Studio |
| `AES_ENCRYPTION_KEY` | 64-char hex AES-256 key | `openssl rand -hex 32` |
| `AES_IV_SECRET` | 32-char hex IV salt | `openssl rand -hex 16` |
| `TOKENIZER_SECRET` | PII tokenizer HMAC secret | `openssl rand -hex 24` |
| `RATE_LIMIT_MAX` | Max requests per window | Default: 10 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | Default: 60000 |
