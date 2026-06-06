import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Goal } from '../types';

export function useEmotionalGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/goals`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGoals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      
      setGoals(fetchedGoals);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching goals:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addGoal = async (title: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/goals`), {
        title,
        status: 'active',
        createdAt: serverTimestamp(),
        lastLinkedAt: null
      });
    } catch (err: any) {
      console.error("Error adding goal:", err);
      throw err;
    }
  };

  const updateGoalStatus = async (goalId: string, status: 'active' | 'archived' | 'completed') => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/goals`, goalId), {
        status
      });
    } catch (err: any) {
      console.error("Error updating goal:", err);
      throw err;
    }
  };

  const updateGoalTitle = async (goalId: string, title: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/goals`, goalId), {
        title
      });
    } catch (err: any) {
      console.error("Error updating goal title:", err);
      throw err;
    }
  };

  return {
    goals,
    activeGoals: goals.filter(g => g.status === 'active'),
    loading,
    error,
    addGoal,
    updateGoalStatus,
    updateGoalTitle
  };
}

// Deterministic matching engine
export function matchGoalsDeterministically(text: string, activeGoals: Goal[]): string[] {
  const lowerText = text.toLowerCase();
  const matchedGoalIds: string[] = [];

  activeGoals.forEach(goal => {
    const title = goal.title.toLowerCase();
    
    // Exact phrase match
    if (lowerText.includes(title)) {
      matchedGoalIds.push(goal.id);
      return;
    }

    // Keyword heuristics based on standard presets
    let isMatch = false;
    if (title.includes('kinder to myself') && (lowerText.includes('forgive myself') || lowerText.includes('hard on myself') || lowerText.includes('inner critic'))) {
      isMatch = true;
    } else if (title.includes('overthinking') && (lowerText.includes('worry') || lowerText.includes('anxious') || lowerText.includes('spiral'))) {
      isMatch = true;
    } else if (title.includes('trust myself') && (lowerText.includes('confidence') || lowerText.includes('gut feeling') || lowerText.includes('instinct'))) {
      isMatch = true;
    } else if (title.includes('protect my mornings') && (lowerText.includes('morning routine') || lowerText.includes('woke up early') || lowerText.includes('peaceful morning'))) {
      isMatch = true;
    } else if (title.includes('creativity') && (lowerText.includes('creative') || lowerText.includes('art') || lowerText.includes('writing') || lowerText.includes('draw'))) {
      isMatch = true;
    } else if (title.includes('boundaries') && (lowerText.includes('said no') || lowerText.includes('drew a line') || lowerText.includes('boundary') || lowerText.includes('protect my energy'))) {
      isMatch = true;
    } else if (title.includes('gratitude') && (lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('appreciate'))) {
      isMatch = true;
    } else if (title.includes('present') && (lowerText.includes('mindful') || lowerText.includes('in the moment') || lowerText.includes('grounded'))) {
      isMatch = true;
    }

    // Generic fallback: check if all major words of the goal title are in the text
    if (!isMatch) {
      const words = title.split(' ').filter(w => w.length > 3);
      if (words.length > 0 && words.every(w => lowerText.includes(w))) {
        isMatch = true;
      }
    }

    if (isMatch) {
      matchedGoalIds.push(goal.id);
    }
  });

  return matchedGoalIds;
}
