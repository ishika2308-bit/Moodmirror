import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "moodmirror-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);
const db = getFirestore(app);

// Connect to emulators only if explicit flag is set
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { app, auth, functions, db };
