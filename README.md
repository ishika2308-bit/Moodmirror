# MoodMirror AI

MoodMirror AI is a voice-first, emotionally intelligent journaling application. Designed to feel like a living mirror rather than a traditional text box, it allows users to reflect on their day through natural voice interaction, powered by Google's Gemini AI and secured by Firebase.

## Features

- **The Mirror Core:** A dynamic, glassmorphic sphere that reacts visually to your emotional state and voice volume.
- **Voice-First Journaling:** Speak your thoughts naturally. The AI analyzes your entries to understand not just what you say, but how you feel.
- **Deep Emotional Analysis:** Powered by Gemini, the app extracts primary emotions, stress levels, emotional drivers, strengths, and concerns.
- **MoodDNA & Emotional Weather:** Visualizations of your emotional consistency, resilience, and optimism over time.
- **Privacy First:** Journal entries are encrypted using AES-256-GCM before being stored in the database. PII (Personally Identifiable Information) is tokenized and masked before being sent to the AI for analysis.
- **3D Interactive Archive:** A beautiful circular gallery to revisit past memories and AI reflections.

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS (v4), Motion (Framer Motion)
- **Backend:** Firebase Cloud Functions (Node.js/TypeScript)
- **Database:** Firebase Firestore
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`)
- **Authentication:** Firebase Auth (Anonymous & Email)

## Repository Structure

This repository acts as a monorepo containing both the frontend and backend:

- `/moodmirror frontend/` - The Vite React frontend application.
- `/moodmirror-backend/moodmirror/` - The Firebase Cloud Functions backend.

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v20+)
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Environment Variables
To run MoodMirror, you need to configure your environment variables.
Copy `.env.example` to `.env.local` inside the frontend directory:

```bash
cp .env.example .env.local
```

Fill in your Firebase project credentials in `.env.local`. **Never commit `.env.local` or any API keys to version control.**

### 3. Firebase Setup
You need a Firebase project with Firestore, Authentication, and Cloud Functions enabled.

1. Log in to Firebase CLI:
   ```bash
   firebase login
   ```
2. Initialize the backend project:
   ```bash
   cd moodmirror-backend/moodmirror
   firebase use --add
   ```
   *Select your created Firebase project.*
3. Set your backend secrets. In your terminal, run:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   firebase functions:secrets:set AES_ENCRYPTION_KEY
   firebase functions:secrets:set AES_IV_SECRET
   firebase functions:secrets:set TOKENIZER_SECRET
   ```

### 4. Running Locally

#### Start the Firebase Emulators (Backend)
```bash
cd moodmirror-backend/moodmirror
npm install
npm run build
firebase emulators:start
```

#### Start the Vite Dev Server (Frontend)
In a new terminal window:
```bash
cd moodmirror frontend
npm install
npm run dev
```
Make sure `VITE_USE_FIREBASE_EMULATORS="true"` is set in your `.env.local` if you are testing against the local emulator suite.

### 5. Deployment

#### Deploying the Backend
```bash
cd moodmirror-backend/moodmirror/functions
npm run build
firebase deploy --only functions
```

#### Deploying the Frontend
```bash
cd moodmirror frontend
npm run build
firebase deploy --only hosting
```

## Contributing
When contributing, please ensure that no environment variables, debug logs, or build artifacts are pushed. The `.gitignore` is configured to prevent this, but please remain vigilant.
