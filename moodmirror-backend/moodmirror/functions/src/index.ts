import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ─── Deterministic Text Parsers ──────────────────────────────────────────────

function extractPeople(text: string): string[] {
  const nameRegex = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b/g;
  const matches = text.match(nameRegex) || [];
  const commonStopwords = new Set([
    "I", "Today", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    "The", "A", "An", "My", "He", "She", "They", "It", "We", "You", "This", "That", "But", "If", "And", "In", "On", "At", "To"
  ]);
  const people = new Set<string>();
  for (const match of matches) {
    if (!commonStopwords.has(match)) {
      people.add(match);
    }
  }
  return Array.from(people);
}

function extractTopicsAndGoals(text: string): { topics: string[], goals: string[] } {
  const textLower = text.toLowerCase();
  const topicMap: Record<string, string[]> = {
    work: ["work", "job", "meeting", "office", "career", "project", "client"],
    health: ["gym", "workout", "exercise", "run", "yoga", "health", "sleep", "diet", "food", "nutrition"],
    relationships: ["family", "friend", "date", "relationship", "partner", "parents", "mom", "dad", "brother", "sister"],
    leisure: ["book", "movie", "game", "hobby", "travel", "vacation", "chill", "relax"]
  };
  
  const goalKeywords = ["goal", "target", "habit", "aim", "plan", "focus", "achieve", "try to", "need to"];
  
  const detectedTopics = new Set<string>();
  for (const [topic, keywords] of Object.entries(topicMap)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        detectedTopics.add(topic);
        break;
      }
    }
  }
  
  const sentences = text.split(/[.!?]+/);
  const detectedGoals: string[] = [];
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    if (goalKeywords.some(keyword => sentenceLower.includes(keyword))) {
      const cleanGoal = sentence.trim();
      if (cleanGoal.length > 5 && cleanGoal.length < 100) {
        detectedGoals.push(cleanGoal);
      }
    }
  }
  
  return {
    topics: Array.from(detectedTopics),
    goals: detectedGoals
  };
}

// ─── Memory Importance Scoring ───────────────────────────────────────────────

function calculateImportanceScore(entryData: any): {
  importanceScore: number;
  emotionIntensity: number;
  hasPhotos: boolean;
  savedToStory: boolean;
} {
  const text = entryData.encryptedJournal || "";
  const length = text.length;
  
  const moodScore = entryData.analysis?.moodScore ?? 50;
  const emotionIntensity = Math.abs(50 - moodScore) / 50;
  
  const hasPhotos = !!entryData.hasPhotos;
  const savedToStory = !!entryData.isSavedToStory;
  
  const lengthScore = Math.min(30, (length / 600) * 30);
  const intensityScore = emotionIntensity * 30;
  const photoScore = hasPhotos ? 20 : 0;
  const storyScore = savedToStory ? 20 : 0;
  
  const importanceScore = Math.round(lengthScore + intensityScore + photoScore + storyScore);
  
  return {
    importanceScore,
    emotionIntensity,
    hasPhotos,
    savedToStory
  };
}

// ─── Insight Provider Architecture ──────────────────────────────────────────

export interface InsightProvider {
  name: string;
  generateInsights(profile: any, recentEntries: any[]): Promise<{
    relationshipInsights: string[];
    companionObservations: string[];
    longTermSummary: string;
  }>;
}

export class GeminiInsightProvider implements InsightProvider {
  name = "Gemini";
  async generateInsights(profile: any, recentEntries: any[]) {
    return {
      relationshipInsights: [
        `You have frequent positive mentions of: ${Object.keys(profile.people || {}).slice(0, 3).join(", ") || "loved ones"}.`
      ],
      companionObservations: [
        `We noticed you write often about topics like: ${Object.keys(profile.topics || {}).join(", ") || "reflection"}.`
      ],
      longTermSummary: "You are maintaining a strong path of emotional growth and consistency."
    };
  }
}

export class QwenInsightProvider implements InsightProvider {
  name = "Qwen";
  async generateInsights(profile: any, recentEntries: any[]): Promise<{
    relationshipInsights: string[];
    companionObservations: string[];
    longTermSummary: string;
  }> {
    throw new Error("Qwen provider not active yet.");
  }
}

export const activeProvider: InsightProvider = new GeminiInsightProvider();

// ─── Cloud Functions Triggers ────────────────────────────────────────────────

export const onJournalEntryCreated = onDocumentCreated("journal_entries/{entryId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const entryData = snapshot.data();
  const userId = entryData.userId;
  const rawText = entryData.encryptedJournal || "";
  const createdAt = entryData.createdAt || admin.firestore.Timestamp.now();
  
  if (!userId) return;
  
  // 1. Run deterministic parsers & importance scoring
  const people = extractPeople(rawText);
  const { topics, goals } = extractTopicsAndGoals(rawText);
  const emotion = entryData.analysis?.primaryEmotion || "Reflective";
  const scoreMetrics = calculateImportanceScore(entryData);
  
  const profileRef = db.collection("users").doc(userId).collection("memory_profile").doc("main");
  const milestonesToCreate: any[] = [];
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(profileRef);
    let profile = doc.data() || {
      languageConfig: {
        detectedLanguage: "en",
        fallbackToCapitalization: true
      },
      people: {},
      topics: {},
      goals: [],
      emotions: {},
      milestones: {
        firstReflection: false,
        firstTimeCapsule: false,
        firstPhoto: false,
        firstCompanionMemory: false,
        streak7Days: false,
        streak30Days: false
      },
      metrics: {
        totalEntries: 0,
        totalCapsules: 0,
        totalPhotos: 0,
        currentStreak: 0
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Increments metrics
    profile.metrics.totalEntries = (profile.metrics.totalEntries || 0) + 1;
    profile.metrics.currentStreak = (profile.metrics.currentStreak || 0) + 1; // Simplistic count trigger
    
    if (entryData.isTemporary) {
      profile.metrics.totalCapsules = (profile.metrics.totalCapsules || 0) + 1;
    }
    if (scoreMetrics.hasPhotos) {
      profile.metrics.totalPhotos = (profile.metrics.totalPhotos || 0) + 1;
    }
    
    // ─── Check and Generate Milestones ───────────────────────────────────────
    
    // A. First Reflection
    if (!profile.milestones.firstReflection) {
      profile.milestones.firstReflection = true;
      milestonesToCreate.push({
        type: "first_reflection",
        title: "First Reflection",
        description: "You took your very first step in capturing your emotional journey.",
        importanceScore: 50
      });
    }
    
    // B. First Time Capsule
    if (entryData.isTemporary && !profile.milestones.firstTimeCapsule) {
      profile.milestones.firstTimeCapsule = true;
      milestonesToCreate.push({
        type: "first_time_capsule",
        title: "First Time Capsule",
        description: "Locked away a piece of today for your future self to rediscover.",
        importanceScore: 60
      });
    }
    
    // C. First Photo Memory
    if (scoreMetrics.hasPhotos && !profile.milestones.firstPhoto) {
      profile.milestones.firstPhoto = true;
      milestonesToCreate.push({
        type: "first_photo_memory",
        title: "First Photo Memory",
        description: "Saved your first visual snapshot alongside your feelings.",
        importanceScore: 65
      });
    }
    
    // D. First Companion Memory
    if (entryData.analysis?.reflection && !profile.milestones.firstCompanionMemory) {
      profile.milestones.firstCompanionMemory = true;
      milestonesToCreate.push({
        type: "first_companion_memory",
        title: "First Companion Insight",
        description: "Received your first companion feedback observing your day.",
        importanceScore: 55
      });
    }
    
    // E. 7 Days of Honesty Streak
    if (profile.metrics.currentStreak === 7 && !profile.milestones.streak7Days) {
      profile.milestones.streak7Days = true;
      milestonesToCreate.push({
        type: "7_days_honesty",
        title: "7 Days Of Honesty",
        description: "One week of reflecting and showing up for yourself.",
        importanceScore: 75
      });
    }
    
    // F. 30 Days of Growth Streak
    if (profile.metrics.currentStreak === 30 && !profile.milestones.streak30Days) {
      profile.milestones.streak30Days = true;
      milestonesToCreate.push({
        type: "30_days_growth",
        title: "30 Days Of Growth",
        description: "Thirty days of emotional transparency and consistency.",
        importanceScore: 90
      });
    }
    
    // Save expanded relationship tracking properties
    const currentMoodScore = entryData.analysis?.moodScore || 50;
    people.forEach(p => {
      if (!profile.people[p]) {
        profile.people[p] = {
          name: p,
          mentionCount: 0,
          averageMood: 0,
          commonEmotions: {},
          // Advanced structural placeholders
          emotionTrend: [],
          relationshipImportance: 0,
          lastMentioned: createdAt
        };
      }
      const rel = profile.people[p];
      rel.averageMood = ((rel.averageMood * rel.mentionCount) + currentMoodScore) / (rel.mentionCount + 1);
      rel.mentionCount += 1;
      rel.commonEmotions[emotion] = (rel.commonEmotions[emotion] || 0) + 1;
      
      // Update advanced properties
      rel.lastMentioned = createdAt;
      rel.relationshipImportance = Math.round(rel.mentionCount * (rel.averageMood / 50));
      
      // Track a sliding window of the last 5 emotions
      rel.emotionTrend.push(emotion);
      if (rel.emotionTrend.length > 5) {
        rel.emotionTrend.shift();
      }
      
      // G. Relationship Milestone: Milestone reached with a specific person
      if (rel.mentionCount === 5 || rel.mentionCount === 10 || rel.mentionCount === 25) {
        milestonesToCreate.push({
          type: "relationship_milestone",
          title: `Bond Milestone: ${p}`,
          description: `You have shared reflections involving ${p} across ${rel.mentionCount} entries.`,
          importanceScore: 40 + Math.min(40, rel.mentionCount)
        });
      }
    });
    
    // Increment topics count
    topics.forEach(t => {
      profile.topics[t] = (profile.topics[t] || 0) + 1;
    });
    
    // Save unique goals
    goals.forEach(g => {
      if (!profile.goals.includes(g)) {
        profile.goals.push(g);
      }
    });
    
    // Increment emotions count
    profile.emotions[emotion] = (profile.emotions[emotion] || 0) + 1;
    profile.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    
    transaction.set(profileRef, profile, { merge: true });
  });

  // 2. Populate Memory Graph
  const graphRef = db.collection("users").doc(userId).collection("memory_graph").doc(snapshot.id);
  await graphRef.set({
    entryId: snapshot.id,
    connections: { people, topics },
    metrics: {
      importanceScore: scoreMetrics.importanceScore,
      emotionIntensity: scoreMetrics.emotionIntensity,
      hasPhotos: scoreMetrics.hasPhotos,
      savedToStory: scoreMetrics.savedToStory
    },
    semanticIndex: {
      vectorEmbeddingId: "",
      embeddingModel: "text-embedding-004",
      rankingWeight: 1.0
    },
    createdAt
  });

  // 3. Create Memory Artifacts & Milestones
  for (const milestone of milestonesToCreate) {
    const milestoneRef = db.collection("users").doc(userId).collection("memory_artifacts").doc();
    await milestoneRef.set({
      ...milestone,
      createdAt
    });
  }

  if (goals.length > 0) {
    const artifactRef = db.collection("users").doc(userId).collection("memory_artifacts").doc();
    await artifactRef.set({
      type: "goal_milestone",
      title: "New Goal Registered",
      description: goals[0],
      importanceScore: scoreMetrics.importanceScore,
      createdAt
    });
  }
});
