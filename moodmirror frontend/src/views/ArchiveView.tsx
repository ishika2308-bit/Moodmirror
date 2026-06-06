import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useSaveJournal } from '../hooks/useSaveJournal';
import { ChevronLeft, MoreHorizontal, LogOut, Check, Search, X, Hash, Users, Sparkles, Image as ImageIcon } from 'lucide-react';
import type { ViewState, EmotionState, AnalysisResult } from '../types';
import InfiniteMenu from '../components/InfiniteMenu/InfiniteMenu';
import CircularGallery from '../components/CircularGallery/CircularGallery';
import Masonry from '../components/Masonry/Masonry';
import PixelCard from '../components/PixelCard/PixelCard';
import { useAuth } from '../context/AuthContext';
import { TimeCapsuleModal } from '../components/Reflection/TimeCapsuleModal';
import { MemoryArtifactGallery } from '../components/ui/MemoryArtifactGallery';
import { useMemorySearch } from '../hooks/useMemorySearch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawEntry {
  id: string;
  text: string;
  isTemporary: boolean;
  isCapsule?: boolean;
  unlockAt?: Timestamp | null;
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
  analysis?: AnalysisResult;
}

interface DayGroup {
  dateKey: string;        // YYYY-MM-DD
  displayDate: string;   // "June 4"
  entries: RawEntry[];
  primaryEmotion: string;
  emotionTheme: EmotionState;
  companionSummary: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMOTION_MAP: Record<string, EmotionState> = {
  hopeful: 'hopeful', happy: 'hopeful', grateful: 'hopeful', optimistic: 'hopeful', joy: 'hopeful', joyfulness: 'hopeful',
  calm: 'calm', peaceful: 'calm', relaxed: 'calm', content: 'calm',
  reflective: 'reflective', nostalgic: 'reflective', thoughtful: 'reflective',
  anxious: 'stressed', stressed: 'stressed', overwhelmed: 'stressed', frustrated: 'stressed', exhaustion: 'stressed', exhausted: 'stressed', tired: 'stressed',
  excited: 'excited', energetic: 'excited',
};

const getEmotionGradient = (emotion: EmotionState | string) => {
  const e = emotion.toLowerCase();
  if (e.includes('hope') || e.includes('happ') || e.includes('grate') || e.includes('optimis') || e.includes('joy')) return 'linear-gradient(135deg, #FFD89B, #A770EF)';
  if (e.includes('calm') || e.includes('peace') || e.includes('relax') || e.includes('content') || e.includes('chill')) return 'linear-gradient(135deg, #A8E6CF, #6DD5FA)';
  if (e.includes('reflect') || e.includes('nostalg') || e.includes('thought')) return 'linear-gradient(135deg, #E2B0FF, #9F44D3)';
  if (e.includes('stress') || e.includes('anxi') || e.includes('overwhelm') || e.includes('frustrat') || e.includes('fear') || e.includes('worry')) return 'linear-gradient(135deg, #FF758C, #FF7EB3)';
  if (e.includes('excit') || e.includes('energ')) return 'linear-gradient(135deg, #FF9A9E, #FECFEF)';
  if (e.includes('exhaust') || e.includes('tired') || e.includes('weary') || e.includes('fatigue') || e.includes('drain')) return 'linear-gradient(135deg, #606c88, #3f4c6b)';
  if (e.includes('sad') || e.includes('depress') || e.includes('down') || e.includes('lone')) return 'linear-gradient(135deg, #4b6cb7, #182848)';
  if (e.includes('ang') || e.includes('mad') || e.includes('annoy')) return 'linear-gradient(135deg, #ff4b1f, #ff9068)';
  // Fallback hash-based color so unknown emotions aren't all the same neutral
  const hash = Array.from(e).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `linear-gradient(135deg, hsl(${hue}, 70%, 85%), hsl(${(hue + 40) % 360}, 60%, 70%))`;
};

const getVariantFromTheme = (theme: EmotionState): "pink" | "blue" | "yellow" | "green" | "purple" | "default" => {
  switch (theme) {
    case 'hopeful': return 'yellow';
    case 'calm': return 'blue';
    case 'reflective': return 'purple';
    case 'stressed': return 'pink';
    case 'excited': return 'pink';
    default: return 'default';
  }
};

function toDateKey(ts: any): string {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return 'Unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDisplayDate(ts: any): string {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return 'Unknown Date';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function daysUntilExpiry(expiresAt: any): number {
  const d = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  if (isNaN(d.getTime())) return 0;
  const diff = d.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Component ───────────────────────────────────────────────────────────────

type TabType = 'journey' | 'vault';

const ArchiveView: React.FC<{ onEmotionChange?: (e: EmotionState) => void }> = ({ onEmotionChange }) => {
  const { userProfile } = useAuth();
  const { promoteToStory, isLoading: isPromoting } = useSaveJournal();
  const companionName = userProfile?.companionName || 'Mira';

  const [activeTab, setActiveTab] = useState<TabType>('journey');
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [vaultEntries, setVaultEntries] = useState<RawEntry[]>([]);
  const [allRawEntries, setAllRawEntries] = useState<RawEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayGroup | null>(null);
  const [selectedVaultEntry, setSelectedVaultEntry] = useState<RawEntry | null>(null);
  const [activeVaultEntry, setActiveVaultEntry] = useState<RawEntry | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [capsuleAction, setCapsuleAction] = useState<RawEntry | null>(null);

  // Search State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { searchQuery, setSearchQuery, searchResults, suggestions } = useMemorySearch(allRawEntries);

  // Month Navigator State
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<string>('');
  
  // Available Months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    dayGroups.forEach(d => {
      if (d.dateKey === 'Unknown') return;
      const date = new Date(d.dateKey);
      // Ensure the date isn't shifted by timezones
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      months.add(adjustedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    });
    return Array.from(months);
  }, [dayGroups]);

  const vaultMenuItems = useMemo(() => {
    const now = Date.now();
    return vaultEntries.map(entry => {
      const dateObj = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt as any);
      const isLockedCapsule = entry.isCapsule && entry.unlockAt && (entry.unlockAt.toMillis ? entry.unlockAt.toMillis() : new Date(entry.unlockAt as any).getTime()) > now;
      const isReadyCapsule = entry.isCapsule && !isLockedCapsule;
      
      return {
        id: entry.id,
        title: isLockedCapsule ? 'Sealed Capsule' : (isReadyCapsule ? 'Ready to Unlock' : (entry.analysis?.primaryEmotion || 'Reflection')),
        description: isLockedCapsule ? 'A message waiting for the future' : (entry.analysis?.reflection || entry.text || 'No reflection'),
        emotion: entry.analysis?.primaryEmotion?.toLowerCase() || 'reflective',
        date: entry.createdAt ? toDisplayDate(entry.createdAt) : '—',
        dateObj,
        gradient: isLockedCapsule ? 'linear-gradient(135deg, #1f1c2c, #928DAB)' : getEmotionGradient(entry.analysis?.primaryEmotion || 'reflective')
      };
    });
  }, [vaultEntries]);

  useEffect(() => {
    if (availableMonths.length > 0 && !activeMonth) {
      setActiveMonth(availableMonths[0]);
    }
  }, [availableMonths, activeMonth]);

  const scrollToMonth = (month: string) => {
    setActiveMonth(month);
    setIsMonthDropdownOpen(false);
    const targetDay = dayGroups.find(d => {
      const date = new Date(d.dateKey);
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return adjustedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) === month;
    });
    if (targetDay) {
      document.getElementById(`day-card-${targetDay.dateKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) { setIsLoading(false); return; }

      try {
        // Fetch journal entries
        const entriesQ = query(
          collection(db, 'journal_entries'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(60)
        );
        const entriesSnap = await getDocs(entriesQ);

        // Fetch analysis reports
        const reportsQ = query(
          collection(db, 'analysis_reports'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(60)
        );
        const reportsSnap = await getDocs(reportsQ);
        const reportsMap = new Map<string, AnalysisResult>();
        reportsSnap.docs.forEach((d) => reportsMap.set(d.id, d.data() as AnalysisResult));

        const allEntries: RawEntry[] = [];
        const now = Date.now();

        entriesSnap.docs.forEach((d) => {
          const data = d.data();
          const expiresAt: any = data.expiresAt ?? null;
          // Skip expired vault entries
          if (expiresAt) {
            const expDate = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
            if (!isNaN(expDate.getTime()) && expDate.getTime() < now) return;
          }

          allEntries.push({
            id: d.id,
            text: data.encryptedJournal || '',
            isTemporary: data.isTemporary ?? false,
            isCapsule: data.isCapsule ?? false,
            unlockAt: data.unlockAt ?? null,
            expiresAt,
            createdAt: data.createdAt as Timestamp,
            analysis: reportsMap.get(d.id),
          });
        });

        // ── Build Reflection Vault ──────────────────────────────────────────
        const vault = allEntries.filter((e) => e.isTemporary || e.isCapsule);
        setVaultEntries(vault);
        setAllRawEntries(allEntries);

        // ── Build Journey day groups (permanent only) ───────────────────────
        const permanent = allEntries.filter((e) => !e.isTemporary && !e.isCapsule);
        const grouped = new Map<string, RawEntry[]>();
        permanent.forEach((e) => {
          if (!e.createdAt) return;
          const key = toDateKey(e.createdAt);
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(e);
        });

        const days: DayGroup[] = [];
        grouped.forEach((entries, dateKey) => {
          // Sort oldest first within a day
          entries.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt as any).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt as any).getTime();
            return timeA - timeB;
          });
          const primary = entries.find((e) => e.analysis?.primaryEmotion) || entries[0];
          const primaryEmotion = primary?.analysis?.primaryEmotion || 'Reflective';
          const emotionTheme = EMOTION_MAP[primaryEmotion.toLowerCase()] || 'reflective';
          const companionSummary = primary?.analysis?.summary || 'A day of reflection.';

          days.push({
            dateKey,
            displayDate: toDisplayDate(entries[entries.length - 1].createdAt),
            entries,
            primaryEmotion,
            emotionTheme,
            companionSummary,
          });
        });

        // Sort days newest first
        days.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
        setDayGroups(days);
      } catch (err) {
        console.error('Archive fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged((user) => {
      if (user) fetchAll();
      else setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePromote = async (entryId: string) => {
    setPromotingId(entryId);
    const ok = await promoteToStory(entryId);
    if (ok) {
      // Optimistic UI: move entry out of vault
      setVaultEntries((prev) => prev.filter((e) => e.id !== entryId));
      setSelectedVaultEntry(null);
    }
    setPromotingId(null);
  };

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetryAnalysis = async (entry: RawEntry) => {
    setRetryingId(entry.id);
    try {
      // In a full implementation, we would extract active goals from context or similar, 
      // but for emergency fallback, we'll just re-analyze with empty goals or let the AI do its best.
      const { analyzeReflectionClient } = await import('../lib/geminiService');
      
      const companionName = userProfile?.companionName || 'Mira';
      const userName = auth.currentUser?.displayName?.split(' ')[0] || 'there';
      const preferredLanguage = userProfile?.preferences?.language || 'English';
      const tone = userProfile?.preferences?.reflectionTone || 'Supportive';

      const result = await analyzeReflectionClient(entry.text, {
        companionName, userName, preferredLanguage, reflectionTone: tone, activeGoals: []
      });

      if (result) {
        const reportRef = doc(db, 'analysis_reports', entry.id);
        await updateDoc(reportRef, {
          ...result,
          analysisStatus: 'completed'
        });
        
        // Optimistically update the UI
        entry.analysis = {
          ...entry.analysis,
          ...result,
          analysisStatus: 'completed'
        };
        setDayGroups([...dayGroups]);
      }
    } catch (err) {
      console.error('Retry failed:', err);
      alert('AI is still unavailable. Please try again later.');
    } finally {
      setRetryingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        // Ambient vault background overrides
        background: activeTab === 'vault' ? 'radial-gradient(circle at 50% 120%, #1a1a2e 0%, #0f0f1a 60%, #000000 100%)' : undefined
      }}
      exit={{ opacity: 0 }}
      className={`flex-1 flex flex-col h-full overflow-hidden relative ${activeTab === 'vault' ? 'text-white' : ''}`}
      transition={{ duration: 1 }}
    >
      {/* Vault ambient floating particles/blur effect */}
      <AnimatePresence>
        {activeTab === 'vault' && !selectedVaultEntry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 pointer-events-none z-0"
          >
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-black/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (Only show in Journey mode, or when vault detail is NOT open... actually, hide in vault completely) */}
      <AnimatePresence>
        {!selectedDay && !selectedVaultEntry && !capsuleAction && activeTab === 'journey' && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="px-6 pt-16 pb-4 relative z-10"
          >
            {/* Tabs */}
            <div className="flex gap-1 rounded-full p-1 mt-4" style={{ background: 'var(--c-border)' }}>
              {(['journey', 'vault'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-300"
                  style={{
                    background: activeTab === tab ? 'var(--c-card)' : 'transparent',
                    color: activeTab === tab ? 'var(--c-text)' : 'var(--c-subtext)',
                    boxShadow: activeTab === tab ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {tab === 'journey' ? '✦ Journey' : '◇ Reflection Vault'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* When in Vault mode, show a minimal header just to switch back */}
      <AnimatePresence>
        {!selectedVaultEntry && !capsuleAction && activeTab === 'vault' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 left-0 right-0 px-6 z-20 flex justify-between items-center"
          >
             <button
                onClick={() => setActiveTab('journey')}
                className="text-[0.65rem] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                ← Back to Journey
             </button>
             <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
                Vault
             </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${activeTab === 'vault' ? 'px-0 pb-0' : 'px-6 pb-32'} relative z-10`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="font-serif italic animate-pulse text-[var(--c-text)] opacity-50">
              Loading your memories...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── JOURNEY TAB ─────────────────────────────────────────────── */}
            {activeTab === 'journey' && !selectedDay && (
              <motion.div
                key="journey-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                {/* Sticky Header: Month Navigator + Search Toggle */}
                {dayGroups.length > 0 && !isSearchActive && (
                  <div className="sticky top-0 z-20 -mx-6 px-6 py-4 bg-transparent mb-6 flex justify-between items-center">
                    <button 
                      onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                      className="flex items-center gap-2 font-serif text-2xl text-[var(--c-text)]"
                    >
                      {activeMonth || 'Journey'} 
                      <ChevronLeft className={`w-5 h-5 transition-transform ${isMonthDropdownOpen ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                    <button 
                      onClick={() => setIsSearchActive(true)}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 text-[var(--c-text)] transition-colors"
                    >
                      <Search size={20} />
                    </button>
                  </div>
                )}
                
                {/* Search UI */}
                <AnimatePresence>
                  {isSearchActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-8"
                    >
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--c-subtext)]" size={20} />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search memories, emotions, people..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-black/5 border border-[var(--c-border)] rounded-2xl py-4 pl-12 pr-12 text-[var(--c-text)] placeholder:text-[var(--c-subtext)] focus:outline-none focus:ring-2 focus:ring-black/10 font-sans text-base transition-all"
                        />
                        <button 
                          onClick={() => {
                            setIsSearchActive(false);
                            setSearchQuery('');
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--c-subtext)] hover:text-[var(--c-text)] p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Suggestions (When query is empty) */}
                      {!searchQuery && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-6">
                          {suggestions.emotions.length > 0 && (
                            <div>
                              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3 flex items-center gap-2">
                                <Sparkles size={12} /> Common Emotions
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.emotions.map(emotion => (
                                  <button key={emotion} onClick={() => setSearchQuery(emotion)} className="px-4 py-2 rounded-full bg-black/5 hover:bg-black/10 text-sm capitalize transition-colors">
                                    {emotion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {suggestions.goals.length > 0 && (
                            <div>
                              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3 flex items-center gap-2">
                                <Hash size={12} /> Active Goals
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.goals.map(goal => (
                                  <button key={goal} onClick={() => setSearchQuery(goal)} className="px-4 py-2 rounded-full border border-[var(--c-border)] hover:bg-black/5 text-sm transition-colors">
                                    {goal}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Search Results */}
                      {searchQuery && searchResults && (
                        <div className="mt-8 space-y-8">
                          {searchResults.topMatch && (
                            <div>
                              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3 flex items-center gap-2">
                                <Sparkles size={12} /> Most Important Match
                              </p>
                              <div className="rounded-[2rem] p-6 bg-[var(--c-card)] shadow-sm border border-[var(--c-border)] relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-10" style={{ background: getEmotionGradient(searchResults.topMatch.analysis?.primaryEmotion || 'reflective') }} />
                                <div className="relative z-10">
                                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3">
                                    {toDisplayDate(searchResults.topMatch.createdAt)} • {searchResults.topMatch.analysis?.primaryEmotion || 'Reflection'}
                                  </p>
                                  <p className="font-serif italic text-lg leading-relaxed text-[var(--c-text)] mb-4">
                                    "{searchResults.topMatch.isCapsule ? 'Sealed Time Capsule' : searchResults.topMatch.text.slice(0, 150)}{searchResults.topMatch.text.length > 150 ? '...' : ''}"
                                  </p>
                                  {searchResults.topMatch.analysis?.emotionalDrivers && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {searchResults.topMatch.analysis.emotionalDrivers.slice(0,3).map(d => (
                                        <span key={d} className="px-2 py-1 bg-black/5 rounded-md text-[0.6rem] uppercase tracking-wider">{d}</span>
                                      ))}
                                    </div>
                                  )}
                                  {searchResults.topMatch.hasPhotos && (
                                     <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-[var(--c-subtext)]">
                                       <ImageIcon size={12} /> Has Photos
                                     </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {searchResults.clusters.map(cluster => (
                            <div key={cluster.label}>
                              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3 flex items-center gap-2">
                                <Users size={12} /> Cluster: {cluster.label}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cluster.entries.slice(0, 4).map(entry => (
                                  <div key={entry.id} className="rounded-2xl p-4 bg-black/5 border border-[var(--c-border)]">
                                    <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-2">
                                      {toDisplayDate(entry.createdAt)}
                                    </p>
                                    <p className="font-sans text-sm line-clamp-2">
                                      {entry.isCapsule ? 'Locked Capsule' : entry.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {cluster.entries.length > 4 && (
                                <p className="text-xs text-[var(--c-subtext)] mt-2 font-medium italic">
                                  + {cluster.entries.length - 4} related memories
                                </p>
                              )}
                            </div>
                          ))}

                          {searchResults.otherMemories.length > 0 && (
                            <div>
                              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3">
                                Other Matches
                              </p>
                              <div className="space-y-4">
                                {searchResults.otherMemories.slice(0, 5).map(entry => (
                                  <div key={entry.id} className="flex gap-4 items-start pb-4 border-b border-[var(--c-border)]">
                                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: getEmotionGradient(entry.analysis?.primaryEmotion || 'reflective') }} />
                                    <div>
                                      <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-1">
                                        {toDisplayDate(entry.createdAt)}
                                      </p>
                                      <p className="font-sans text-sm line-clamp-2">
                                        {entry.isCapsule ? 'Locked Capsule' : entry.text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(!searchResults.topMatch && searchResults.clusters.length === 0 && searchResults.otherMemories.length === 0) && (
                            <p className="text-center text-[var(--c-subtext)] py-8 font-serif italic">No memories found for "{searchQuery}"</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!isSearchActive && (
                  <>
                    <AnimatePresence>
                      {isMonthDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-16 left-0 right-0 z-30 bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-2 shadow-2xl"
                        >
                          {availableMonths.map(month => (
                            <button
                              key={month}
                              onClick={() => scrollToMonth(month)}
                              className={`w-full text-left px-4 py-3 rounded-xl font-sans text-sm ${activeMonth === month ? 'bg-white/10 text-[var(--c-text)]' : 'text-[var(--c-subtext)] hover:bg-white/5'} transition-colors`}
                            >
                              {month}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {dayGroups.length === 0 ? (
                      <p className="font-sans text-sm text-[var(--c-subtext)] opacity-70 text-center mt-16 leading-relaxed">
                        Your journey begins with the first entry you add to your story.
                      </p>
                    ) : (
                  <Masonry
                    items={dayGroups.map((day, i) => ({
                      id: day.dateKey,
                      height: 250 + (i % 3) * 60 + (day.companionSummary.length > 50 ? 50 : 0), // Vary heights for masonry look
                      data: day
                    }))}
                    renderItem={(item) => {
                      const day = item.data;
                      const gradient = getEmotionGradient(day.primaryEmotion);
                      let dateNum = '?';
                      let monthName = '?';
                      if (day.dateKey !== 'Unknown') {
                        const dayDate = new Date(day.dateKey);
                        const adjustedDate = new Date(dayDate.getTime() + dayDate.getTimezoneOffset() * 60000);
                        dateNum = String(adjustedDate.getDate());
                        monthName = adjustedDate.toLocaleDateString('en-US', { month: 'long' });
                      }
                      return (
                        <motion.button
                          layoutId={`journey-card-${day.dateKey}`}
                          id={`day-card-${day.dateKey}`}
                          onClick={() => { setSelectedDay(day); onEmotionChange?.(day.emotionTheme); }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full h-full text-left rounded-[2rem] transition-all break-inside-avoid relative overflow-hidden group"
                          style={{
                            background: gradient,
                            border: `1px solid rgba(255,255,255,0.3)`,
                            boxShadow: `0 10px 30px -10px rgba(0,0,0,0.4)`,
                          }}
                        >
                          <PixelCard variant={getVariantFromTheme(day.emotionTheme)}>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/60 group-hover:from-black/0 group-hover:to-black/50 transition-colors duration-500" />
                            <div className="relative z-10 flex flex-col h-full p-6">
                              <div className="font-serif text-6xl text-white mb-2 drop-shadow-lg opacity-95">
                                {dateNum}
                              </div>
                              <p className="font-serif italic text-[1.1rem] text-white line-clamp-3 leading-relaxed mb-6 drop-shadow-md flex-grow">
                                "{day.companionSummary}"
                              </p>
                              <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/30">
                                <span className="font-sans text-sm font-bold text-white uppercase tracking-[0.2em] drop-shadow-md">
                                  {monthName}
                                </span>
                                <div className="text-right">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white mb-1.5 drop-shadow-md opacity-90">
                                    {companionName} · {day.primaryEmotion}
                                  </p>
                                  <span className="text-[0.55rem] font-bold uppercase tracking-widest text-white bg-black/30 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-inner">
                                    {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </PixelCard>
                        </motion.button>
                      );
                    }}
                  />
                )}
                </>
              )}
              </motion.div>
            )}

            {/* ── DAY DETAIL ──────────────────────────────────────────────── */}
            {activeTab === 'journey' && selectedDay && (
              <motion.div
                key="day-detail"
                layoutId={`journey-card-${selectedDay.dateKey}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="relative p-6 rounded-[2rem] overflow-hidden"
                style={{
                  background: getEmotionGradient(selectedDay.primaryEmotion),
                }}
              >
                {/* Inner glass overlay for readability */}
                <div className="absolute inset-0 bg-[#F9F9F9]/95 backdrop-blur-3xl transition-colors duration-500" />
                
                <div className="relative z-10">
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="flex items-center gap-2 mb-6 mt-2 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] opacity-70 hover:opacity-100 transition-opacity"
                  >
                    ← Back to Journey
                  </button>

                <h2 className="font-serif text-3xl text-[var(--c-text)] mb-1">{selectedDay.displayDate}</h2>
                <p className="font-sans text-[0.65rem] uppercase tracking-widest text-[var(--c-subtext)] opacity-60 mb-6">
                  {selectedDay.entries.length} {selectedDay.entries.length === 1 ? 'reflection' : 'reflections'}
                </p>

                {/* Companion summary card */}
                <div
                  className="rounded-[1.5rem] p-5 mb-6 bg-white/10 shadow-lg border border-white/20"
                >
                  <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-2">
                    {companionName} says
                  </p>
                  <p className="font-serif italic text-base text-[var(--c-text)] leading-relaxed">
                    "{selectedDay.companionSummary}"
                  </p>
                </div>

                {/* Emotion drivers */}
                {selectedDay.entries[0]?.analysis?.emotionalDrivers?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedDay.entries[0].analysis!.emotionalDrivers.map((d) => (
                      <span key={d} className="px-3 py-1 rounded-full text-[0.6rem] font-medium uppercase tracking-wider"
                        style={{ background: 'var(--c-border)', color: 'var(--c-text)' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* All reflections for the day */}
                <h3 className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-[var(--c-subtext)] mb-3">
                  Your Story
                </h3>
                <div className="space-y-4">
                  {selectedDay.entries.map((entry, i) => {
                    const entryTime = entry.createdAt as any;
                    const d = entryTime?.toDate ? entryTime.toDate() : new Date(entryTime);
                    const timeLabel = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return (
                      <div key={entry.id} className="rounded-[1.5rem] p-5 bg-black/20 shadow-lg border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-white/60">
                            {timeLabel}
                          </span>
                          {entry.analysis?.primaryEmotion && (
                            <span className="font-sans text-[0.55rem] font-medium uppercase tracking-wider text-[var(--c-text)] opacity-90 bg-black/20 px-2 py-1 rounded-full">
                              {entry.analysis.primaryEmotion}
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-sm text-[var(--c-text)] leading-relaxed">{entry.text}</p>
                        
                        {entry.analysis?.attachments && entry.analysis.attachments.length > 0 && (
                          <div className="mt-4">
                            <MemoryArtifactGallery attachments={entry.analysis.attachments} />
                          </div>
                        )}

                        {entry.analysis?.reflection && (
                          <p className="font-serif italic text-xs text-white/70 mt-3 leading-relaxed border-t border-white/10 pt-3">
                            "{entry.analysis.reflection}"
                          </p>
                        )}
                        {(entry.analysis?.analysisStatus === 'failed' || entry.analysis?.analysisStatus === 'pending') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRetryAnalysis(entry); }}
                            disabled={retryingId === entry.id}
                            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
                          >
                            {retryingId === entry.id ? 'Retrying...' : 'Retry AI Analysis'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                </div>
              </motion.div>
            )}

            {/* ── REFLECTION VAULT TAB ────────────────────────────────────── */}
            {activeTab === 'vault' && !selectedVaultEntry && (
              <motion.div
                key="vault-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col h-full w-full"
              >
                {vaultEntries.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <p className="font-sans text-sm text-white/50 text-center leading-relaxed">
                      No temporary reflections. When you "Keep in Reflection Vault", they'll appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 relative flex flex-col">
                    <div className="flex-1 w-full h-full pt-10">
                      <InfiniteMenu 
                        items={vaultMenuItems}
                        onItemClick={(item) => {
                          const entry = vaultEntries.find(e => e.id === item.id);
                          if (entry) {
                            if (entry.isCapsule) {
                              setCapsuleAction(entry);
                            } else {
                              setSelectedVaultEntry(entry);
                            }
                          }
                        }}
                        onActiveItemChange={(item) => {
                          const entry = vaultEntries.find(e => e.id === item.id);
                          setActiveVaultEntry(entry || null);
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── VAULT ENTRY DETAIL ──────────────────────────────────────── */}
            {activeTab === 'vault' && selectedVaultEntry && (
              <motion.div
                key="vault-detail"
                layoutId={`vault-circle-${selectedVaultEntry.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-0 z-50 p-6 md:rounded-[2.5rem] overflow-y-auto backdrop-blur-[60px]"
                style={{
                  background: `linear-gradient(to bottom, rgba(15, 15, 26, 0.85), rgba(15, 15, 26, 0.95)), ${getEmotionGradient(selectedVaultEntry.analysis?.primaryEmotion || 'reflective')}`,
                  backgroundAttachment: 'fixed',
                  backgroundSize: 'cover',
                  minHeight: '100%'
                }}
              >
                
                <div className="relative z-10 pt-10 pb-28">
                  <button
                    onClick={() => setSelectedVaultEntry(null)}
                    className="flex items-center gap-2 mb-8 mt-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-opacity"
                  >
                    ← Close Reflection
                  </button>

                  <h2 className="font-serif text-4xl text-white mb-2">{toDisplayDate(selectedVaultEntry.createdAt)}</h2>

                  {selectedVaultEntry.expiresAt && (
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest mb-8"
                      style={{ color: daysUntilExpiry(selectedVaultEntry.expiresAt) <= 1 ? '#ff7eb3' : 'rgba(255,255,255,0.6)' }}>
                      {daysUntilExpiry(selectedVaultEntry.expiresAt) === 0 ? 'Expires today' : 
                       daysUntilExpiry(selectedVaultEntry.expiresAt) === 1 ? 'Expires tomorrow' : 
                       `Deletes in ${daysUntilExpiry(selectedVaultEntry.expiresAt)} days`}
                    </p>
                  )}

                  {selectedVaultEntry.analysis?.reflection && (
                    <div className="rounded-[2rem] p-6 mb-6 bg-white/10 shadow-2xl border border-white/20 backdrop-blur-md">
                      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-white/60 mb-3">
                        {companionName} says
                      </p>
                      <p className="font-serif italic text-xl text-white leading-relaxed">
                        "{selectedVaultEntry.analysis.reflection}"
                      </p>
                    </div>
                  )}

                  <div className="rounded-[2rem] p-6 mb-8 bg-black/20 shadow-inner border border-white/5">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-white/60 mb-3">
                      Your words
                    </p>
                    <p className="font-sans text-[1.05rem] text-white/90 leading-relaxed font-light">
                      {selectedVaultEntry.text}
                    </p>
                  </div>

                  {/* Emotion drivers */}
                  {(selectedVaultEntry.analysis?.emotionalDrivers?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                      {selectedVaultEntry.analysis!.emotionalDrivers.map((d) => (
                        <span key={d} className="px-4 py-2 rounded-full text-[0.65rem] font-bold uppercase tracking-widest bg-white/10 text-white border border-white/20 shadow-sm">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Promote action */}
                  <button
                    id={`promote-btn-${selectedVaultEntry.id}`}
                    onClick={() => handlePromote(selectedVaultEntry.id)}
                    disabled={isPromoting || promotingId === selectedVaultEntry.id}
                    className="w-full py-5 rounded-full text-[0.75rem] font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    style={{ background: 'white', color: 'black' }}
                  >
                    {promotingId === selectedVaultEntry.id ? 'Moving...' : "✦ Add To Today's Story"}
                  </button>
                  <p className="text-center text-[0.6rem] text-white/50 mt-4 uppercase tracking-widest font-bold">
                    This will save it permanently to your journey
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {capsuleAction && (
          <TimeCapsuleModal
            mode={(capsuleAction.unlockAt && (capsuleAction.unlockAt.toMillis ? capsuleAction.unlockAt.toMillis() : new Date(capsuleAction.unlockAt as any).getTime()) > Date.now()) ? 'locked' : 'unlock'}
            memory={capsuleAction}
            onClose={() => setCapsuleAction(null)}
            onUnlock={() => {
              // After ceremony, treat it as promoted to story
              handlePromote(capsuleAction.id);
              setCapsuleAction(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArchiveView;
