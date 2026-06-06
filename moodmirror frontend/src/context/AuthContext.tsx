import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  companionName?: string;
  onboardingCompleted?: boolean;
  preferences?: {
    language?: string;
    reflectionTone: 'Gentle' | 'Direct' | 'Supportive' | 'Analytical';
    reminderFrequency: 'Off' | 'Morning' | 'Evening' | 'Custom';
    temporaryLifespanDays: number;
    hideTemporaryReflections: boolean;
  };
  [key: string]: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  bypassLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  };

  const handleUserDoc = async (user: User) => {
    try {
      console.log("create user document start", user.uid);
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
        console.log("create user document success (updated existing document)");
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          companionName: ''
        });
        console.log("create user document success (new document created)");
      }
    } catch (error) {
      console.error("create user document failure. Exact Firestore error:", error);
    }
  };

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("auth success (redirect) for user:", result.user.uid);
          await handleUserDoc(result.user);
        }
      } catch (error) {
        console.error("Redirect auth error", error);
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshProfile();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        console.log("auth success for user:", result.user.uid);
        await handleUserDoc(result.user);
      }
    } catch (error) {
      console.error("Auth error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const bypassLogin = async () => {
    const mockUser = { uid: 'dev-user-123', displayName: 'Dev User', email: 'dev@example.com', photoURL: '' } as User;
    setCurrentUser(mockUser);
    setUserProfile({
      uid: 'dev-user-123',
      displayName: 'Dev User',
      email: 'dev@example.com',
      photoURL: '',
      companionName: 'Nova'
    });
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, logout, refreshProfile, bypassLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
