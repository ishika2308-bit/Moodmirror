import admin from 'firebase-admin';

// Connect to the local emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'moodmirror-dev' // Use default dev project ID
});

const db = admin.firestore();
const auth = admin.auth();

const JOURNALS = [
  {
    text: "Started my new internship today! I'm honestly super nervous but also really excited. The team seems nice, especially Sarah who showed me around the office. I really want to focus on learning as much as possible this summer.",
    emotion: "Excited",
    secondaryEmotion: "Nervous",
    stress: 40, pos: 80, energy: 90, focus: 75,
    drivers: ["internship", "first day", "career"],
    people: ["Sarah"],
    recommendation: "It's completely normal to feel nervous! Channel that energy into your curiosity.",
    offsetDays: 30,
    isCapsule: false,
    hasPhoto: true,
    photoUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80"
  },
  {
    text: "Had a really deep conversation with Ishieee tonight. We talked about where we want to be in five years. It's crazy how fast time is moving. I feel so grateful for her friendship, she always knows exactly what to say when I'm doubting myself.",
    emotion: "Grateful",
    secondaryEmotion: "Reflective",
    stress: 10, pos: 90, energy: 40, focus: 60,
    drivers: ["friendship", "future", "deep talk"],
    people: ["Ishieee"],
    recommendation: "Hold onto friends like Ishieee. Maybe write her a quick text to let her know you appreciate her.",
    offsetDays: 25,
    isCapsule: false,
    hasPhoto: true,
    photoUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80"
  },
  {
    text: "This hackathon is absolutely destroying my sleep schedule. We've been coding for 16 hours straight. Alex found a massive bug in our backend and we had to rewrite the entire auth flow. I'm stressed, but honestly, the energy in this room is incredible. We need to finish this.",
    emotion: "Stressed",
    secondaryEmotion: "Motivated",
    stress: 85, pos: 60, energy: 95, focus: 90,
    drivers: ["hackathon", "coding", "exhaustion"],
    people: ["Alex"],
    recommendation: "Remember to drink water and take a 5-minute screen break! You've got this.",
    offsetDays: 20,
    isCapsule: false,
    hasPhoto: false
  },
  {
    text: "We actually won the hackathon!!! I can't believe it. Alex, Sarah, and I were literally crying when they announced our project. All that stress was 100% worth it. I need to sleep for a week now.",
    emotion: "Joyful",
    secondaryEmotion: "Exhausted",
    stress: 10, pos: 100, energy: 20, focus: 30,
    drivers: ["hackathon", "winning", "success"],
    people: ["Alex", "Sarah"],
    recommendation: "Celebrate this massive win! And yes, please get some well-deserved sleep.",
    offsetDays: 19,
    isCapsule: false,
    hasPhoto: true,
    photoUrl: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=400&q=80"
  },
  {
    text: "Feeling really lost today. The internship project is way harder than I thought. I keep getting stuck on the React state management and I feel like I'm falling behind. I don't want to disappoint the team. I need to achieve my goal of mastering this codebase.",
    emotion: "Overwhelmed",
    secondaryEmotion: "Insecure",
    stress: 80, pos: 20, energy: 30, focus: 40,
    drivers: ["internship", "imposter syndrome", "struggle"],
    people: [],
    recommendation: "Everyone feels lost at the beginning of an internship. Don't be afraid to ask for help—it shows you want to learn.",
    offsetDays: 14,
    isCapsule: false,
    hasPhoto: false
  },
  {
    text: "Sarah noticed I was struggling and sat down to pair program with me for two hours. It clicked! I finally understand how the state flows. I feel so much lighter. I'm going to write this down to remind myself that it's okay to ask for help.",
    emotion: "Relieved",
    secondaryEmotion: "Grateful",
    stress: 30, pos: 85, energy: 60, focus: 75,
    drivers: ["learning", "mentorship", "breakthrough"],
    people: ["Sarah"],
    recommendation: "What a great breakthrough! Keep this memory for the next time you feel stuck.",
    offsetDays: 13,
    isCapsule: true, // Will lock
    hasPhoto: false
  },
  {
    text: "Just got coffee with Ishieee and vented about the internship. She reminded me of how far I've come since last year. She's right. I need to stop being so hard on myself. We took some silly photos at the cafe.",
    emotion: "Calm",
    secondaryEmotion: "Supported",
    stress: 20, pos: 75, energy: 50, focus: 50,
    drivers: ["friendship", "perspective", "coffee"],
    people: ["Ishieee"],
    recommendation: "It's wonderful how a change of perspective from a good friend can reset your day.",
    offsetDays: 7,
    isCapsule: false,
    hasPhoto: true,
    photoUrl: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80"
  },
  {
    text: "Final presentation for the internship is tomorrow. I've practiced it three times. Alex texted me to wish me luck. I'm feeling ready, just a bit of normal anticipation.",
    emotion: "Determined",
    secondaryEmotion: "Anxious",
    stress: 50, pos: 70, energy: 80, focus: 85,
    drivers: ["presentation", "internship", "anticipation"],
    people: ["Alex"],
    recommendation: "You've put in the work. Trust your preparation and get a good night's rest.",
    offsetDays: 1,
    isCapsule: false,
    hasPhoto: false
  }
];

async function seed() {
  console.log("Starting DB seed...");
  
  // Find an existing user or create a dev user
  let targetUid = 'dev-user-123';
  try {
    const listUsersResult = await auth.listUsers(1);
    if (listUsersResult.users.length > 0) {
      targetUid = listUsersResult.users[0].uid;
      console.log(`Found real user: ${listUsersResult.users[0].email} (${targetUid})`);
    } else {
      console.log(`No Auth users found, falling back to ${targetUid}`);
    }
  } catch (err) {
    console.log("Could not list users, using default UID", err);
  }

  const batch = db.batch();
  const now = Date.now();

  for (let i = 0; i < JOURNALS.length; i++) {
    const j = JOURNALS[i];
    const entryId = db.collection('journal_entries').doc().id;
    const date = new Date(now - (j.offsetDays * 24 * 60 * 60 * 1000));
    const isLocked = j.isCapsule;
    
    let attachments = [];
    if (j.hasPhoto) {
      attachments.push({
        id: `photo_${i}`,
        type: 'image',
        url: j.photoUrl,
        createdAt: date
      });
    }

    const entryRef = db.collection('users').doc(targetUid).collection('journal_entries').doc(entryId);
    const reportRef = db.collection('users').doc(targetUid).collection('analysis_reports').doc(entryId);

    // Mock Mood Score
    const moodScore = Math.round((j.pos * 0.4) + (j.energy * 0.2) + (j.focus * 0.2) + ((100 - j.stress) * 0.2));

    batch.set(entryRef, {
      userId: targetUid,
      text: isLocked ? "ENCRYPTED_TEXT" : j.text,
      encryptedJournal: j.text, // The backend needs this to extract insights
      wordCount: j.text.split(' ').length,
      isTemporary: j.isCapsule,
      isCapsule: j.isCapsule,
      unlockAt: isLocked ? new Date(now + (7 * 24 * 60 * 60 * 1000)) : null,
      expiresAt: null,
      createdAt: date,
      attachments: attachments,
      isSavedToStory: !j.isCapsule,
      hasPhotos: j.hasPhoto
    });

    batch.set(reportRef, {
      userId: targetUid,
      primaryEmotion: j.emotion,
      secondaryEmotion: j.secondaryEmotion,
      moodScore: moodScore,
      moodGrade: moodScore > 80 ? 'A' : moodScore > 60 ? 'B' : moodScore > 40 ? 'C' : 'D',
      moodLabel: j.emotion,
      stressLevel: j.stress,
      positivity: j.pos,
      energy: j.energy,
      focus: j.focus,
      emotionalDrivers: j.drivers,
      strengths: ["resilience", "honesty"],
      concerns: [],
      linkedGoalIds: [],
      reflection: `A beautifully authentic reflection about ${j.drivers[0]}. ${j.recommendation}`,
      recommendation: j.recommendation,
      summary: `${j.emotion} day focused on ${j.drivers.join(', ')}.`,
      isTemporary: j.isCapsule,
      isCapsule: j.isCapsule,
      unlockAt: isLocked ? new Date(now + (7 * 24 * 60 * 60 * 1000)) : null,
      expiresAt: null,
      createdAt: date,
      attachments: attachments
    });
  }

  await batch.commit();
  console.log(`Successfully seeded ${JOURNALS.length} journal entries for user ${targetUid}!`);
  console.log("The background cloud functions should now automatically process these entries into memory graphs and profiles.");
}

seed().catch(console.error);
