import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Download, Trash2, SlidersHorizontal, LogOut, Sparkles, Pencil, Check, X, Palette } from 'lucide-react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ThemeSelector } from '../components/ThemeSelector/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { ProfilePictureUpload } from '../components/ui/ProfilePictureUpload';

const SelfView: React.FC<{ onOpenReflection: () => void }> = ({ onOpenReflection }) => {
  const { currentUser, logout, userProfile, refreshProfile } = useAuth();
  const { activeTheme, setTheme } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const companionName = userProfile?.companionName || 'Mira';

  const startEditName = () => {
    setNameInput(companionName);
    setEditingName(true);
  };

  const creationDate = currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : new Date();
  const daysSinceSignup = Math.floor((new Date().getTime() - creationDate.getTime()) / (1000 * 3600 * 24));
  // Show only after 7 days, and only on day 7 and 8 of the cycle (cycle day 0 or 1)
  const isWeeklyReflectionAvailable = daysSinceSignup >= 7 && (daysSinceSignup % 7 <= 1);

  const cancelEditName = () => {
    setEditingName(false);
    setNameInput('');
  };

  const saveCompanionName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !auth.currentUser) return;
    setSavingName(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { companionName: trimmed }, { merge: true });
      await refreshProfile();
      setEditingName(false);
    } catch (e) {
      console.error('Failed to update companion name:', e);
    } finally {
      setSavingName(false);
    }
  };


  const [exporting, setExporting] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportData = async () => {
    if (!auth.currentUser) return;
    setExporting(true);
    try {
      const q = query(collection(db, 'journal_entries'), where('userId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moodmirror-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showToast('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const updatePreference = async (key: string, value: any) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        preferences: { [key]: value }
      }, { merge: true });
      await refreshProfile();
    } catch (e) {
      console.error('Failed to update preference:', e);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const prefs = userProfile?.preferences || {};
  const reflectionTone = prefs.reflectionTone || 'Supportive';
  const reminderFrequency = prefs.reminderFrequency || 'Off';
  const lifespan = prefs.temporaryLifespanDays || 7;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-6 pt-16 pb-32 h-full overflow-y-auto"
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[var(--c-text)] text-[var(--c-card)] px-4 py-2 rounded-full shadow-lg font-sans text-xs font-semibold tracking-wide"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <AnimatePresence mode="wait">
            {editingName ? (
              <motion.div
                key="editing-user"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mb-1"
              >
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  maxLength={32}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={async (e) => { 
                    if (e.key === 'Enter') {
                      const trimmed = nameInput.trim();
                      if (trimmed && auth.currentUser) {
                        setSavingName(true);
                        await setDoc(doc(db, 'users', auth.currentUser.uid), { displayName: trimmed }, { merge: true });
                        await refreshProfile();
                        setSavingName(false);
                        setEditingName(false);
                      }
                    }
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="bg-transparent border-b border-[var(--c-text)]/30 text-[var(--c-text)] text-3xl font-serif outline-none py-0.5 w-40"
                  placeholder="Your name"
                />
              </motion.div>
            ) : (
              <motion.div
                key="display-user"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 mb-1"
              >
                <h1 className="font-serif text-3xl text-[var(--c-text)]">
                  {currentUser?.displayName || 'Self'}
                </h1>
                <button
                  onClick={() => {
                    setNameInput(currentUser?.displayName || '');
                    setEditingName(true);
                  }}
                  className="text-[var(--c-subtext)] opacity-50 hover:opacity-80 transition-opacity p-1 mt-1"
                >
                  <Pencil size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="font-sans text-sm text-[var(--c-subtext)] opacity-80">{currentUser?.email}</p>
        </div>
        
        <div className="shrink-0">
          <ProfilePictureUpload 
            currentPhotoUrl={currentUser?.photoURL || null}
            onPhotoUploaded={async (url) => {
              if (auth.currentUser) {
                await setDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: url }, { merge: true });
                await refreshProfile();
                showToast('Profile picture updated');
              }
            }}
            size="md"
          />
        </div>
      </div>

      {/* Weekly Reflection Card */}
      <AnimatePresence>
        {isWeeklyReflectionAvailable && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            onClick={onOpenReflection}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden min-h-[220px] rounded-[2rem] p-8 text-left flex flex-col justify-between shadow-xl border border-[var(--c-border)] transition-colors cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--theme-color, #8400ff), var(--theme-color-light, #c864ff))',
              color: 'white'
            }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-20 rounded-full blur-3xl -mt-10 -mr-10" />
            <div className="flex flex-col justify-center relative z-10">
              <h3 className="font-serif text-3xl text-white mb-3 font-medium tracking-tight">Weekly Reflection</h3>
              <p className="font-sans text-base font-medium text-white/90 pr-8 leading-relaxed max-w-[85%]">
                A summary of where your mind traveled this week.
              </p>
            </div>
            <div className="mt-6 flex justify-end relative z-10">
              <div className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest shadow-md">
                Open
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">

        {/* Companion Section */}
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] ml-2">
          Your Companion
        </h2>

        <div className="surface-glass rounded-[1.5rem] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full shrink-0"
              style={{
                background: 'radial-gradient(circle at 35% 35%, rgba(200,180,255,0.9), rgba(100,160,255,0.6))',
                boxShadow: '0 0 20px rgba(160,140,255,0.35)',
              }}
            />
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {editingName ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      id="companion-name-input"
                      autoFocus
                      type="text"
                      value={nameInput}
                      maxLength={32}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveCompanionName(); if (e.key === 'Escape') cancelEditName(); }}
                      className="flex-1 bg-transparent border-b border-[var(--c-text)]/30 text-[var(--c-text)] text-sm font-medium outline-none py-0.5"
                      placeholder="Companion name"
                    />
                    <button
                      onClick={saveCompanionName}
                      disabled={savingName}
                      id="save-companion-name-btn"
                      className="text-[var(--c-text)] opacity-70 hover:opacity-100 transition-opacity p-2"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEditName}
                      className="text-[var(--c-text)] opacity-40 hover:opacity-70 transition-opacity p-2"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="font-sans text-sm font-semibold text-[var(--c-text)]">{companionName}</span>
                    <button
                      onClick={startEditName}
                      id="edit-companion-name-btn"
                      className="text-[var(--c-subtext)] opacity-50 hover:opacity-80 transition-opacity p-2 -ml-2"
                    >
                      <Pencil size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="font-sans text-[0.65rem] text-[var(--c-subtext)] opacity-80 mt-0.5 font-medium">
                Your reflection companion
              </p>
            </div>
          </div>
          <p className="font-sans text-xs text-[var(--c-subtext)] opacity-80 leading-relaxed font-medium">
            {companionName} listens to your reflections and responds like a trusted friend — warm, honest, and always on your side.
          </p>

          <button
            onClick={() => setShowThemeSelector(true)}
            className="mt-5 w-full flex items-center justify-between p-3 rounded-2xl transition-colors"
            style={{
              background: 'var(--c-border)',
              color: 'var(--c-text)'
            }}
          >
            <div className="flex items-center gap-3">
              <Palette size={16} className="opacity-80" />
              <span className="font-sans text-sm font-semibold tracking-wide">Companion Aura</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold uppercase tracking-widest opacity-60">
                {activeTheme}
              </span>
            </div>
          </button>
        </div>

        {/* Preferences */}
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] ml-2 mt-8">
          Preferences
        </h2>

        <div className="surface-glass rounded-[1.5rem] p-2 flex flex-col gap-1">
          <button 
            onClick={() => {
              const isDark = ['moonlight', 'cosmic'].includes(activeTheme);
              setTheme(isDark ? 'aurora' : 'moonlight');
            }}
            className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Sparkles size={18} className="text-[var(--c-text)] opacity-80" />
              <span className="font-sans text-sm font-bold text-[var(--c-text)]">Dark Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold uppercase tracking-widest opacity-60">
                {['moonlight', 'cosmic'].includes(activeTheme) ? 'ON' : 'OFF'}
              </span>
            </div>
          </button>

          <div className="h-px bg-[var(--c-border)] mx-4 my-1 opacity-50" />

          <button 
            onClick={() => toggleSection('reflection')}
            className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <SlidersHorizontal size={18} className="text-[var(--c-text)] opacity-80" />
              <span className="font-sans text-sm font-bold text-[var(--c-text)]">Reflection Settings</span>
            </div>
          </button>
          
          <AnimatePresence>
            {openSection === 'reflection' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 pb-4 flex flex-col gap-5 overflow-hidden"
              >
                <div>
                  <label className="font-sans text-xs font-bold text-[var(--c-text)] uppercase tracking-widest mb-3 block opacity-80">Companion Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {['Gentle', 'Direct', 'Supportive', 'Analytical'].map(tone => (
                      <button 
                        key={tone}
                        onClick={() => updatePreference('reflectionTone', tone)}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${reflectionTone === tone ? 'bg-[var(--c-text)] text-[var(--c-card)] border-[var(--c-text)] shadow-sm' : 'bg-transparent text-[var(--c-text)] border-[var(--c-border)] opacity-70 hover:opacity-100 hover:border-[var(--c-text)]/30'}`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-sans text-xs font-bold text-[var(--c-text)] uppercase tracking-widest mb-3 block opacity-80">Companion Language</label>
                  <div className="flex flex-wrap gap-2">
                    {['English', 'Hindi', 'Hinglish'].map(lang => (
                      <button 
                        key={lang}
                        onClick={() => updatePreference('language', lang)}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${(prefs.language || 'English') === lang ? 'bg-[var(--c-text)] text-[var(--c-card)] border-[var(--c-text)] shadow-sm' : 'bg-transparent text-[var(--c-text)] border-[var(--c-border)] opacity-70 hover:opacity-100 hover:border-[var(--c-text)]/30'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-sans text-xs font-bold text-[var(--c-text)] uppercase tracking-widest mb-3 block opacity-80">Reminder Frequency</label>
                  <div className="flex flex-wrap gap-2">
                    {['Off', 'Morning', 'Evening'].map(freq => (
                      <button 
                        key={freq}
                        onClick={() => updatePreference('reminderFrequency', freq)}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${reminderFrequency === freq ? 'bg-[var(--c-text)] text-[var(--c-card)] border-[var(--c-text)] shadow-sm' : 'bg-transparent text-[var(--c-text)] border-[var(--c-border)] opacity-70 hover:opacity-100 hover:border-[var(--c-text)]/30'}`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-sans text-xs font-bold text-[var(--c-text)] uppercase tracking-widest mb-3 block opacity-80">Temporary Lifespan</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={lifespan} 
                    onChange={(e) => updatePreference('temporaryLifespanDays', parseInt(e.target.value))}
                    className="w-full accent-[var(--c-text)] h-2 bg-[var(--c-border)] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs font-bold text-[var(--c-text)] mt-2 opacity-80">{lifespan} days</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px bg-[var(--c-border)] mx-4 my-1 opacity-50" />
          
          <button 
            onClick={() => toggleSection('privacy')}
            className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Shield size={18} className="text-[var(--c-text)] opacity-80" />
              <span className="font-sans text-sm font-bold text-[var(--c-text)]">Privacy Controls</span>
            </div>
          </button>

          <AnimatePresence>
            {openSection === 'privacy' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 pb-4 flex flex-col gap-6 overflow-hidden"
              >
                <div className="flex items-center justify-between mt-2">
                  <div className="pr-4">
                    <div className="font-sans text-sm font-bold text-[var(--c-text)]">Store Reflections Locally</div>
                    <div className="font-sans text-xs font-medium text-[var(--c-subtext)] opacity-80 mt-1">Coming soon in v2.0 roadmap</div>
                  </div>
                  <button 
                    onClick={() => showToast('Local storage sync coming soon.')}
                    className="w-12 h-7 bg-[var(--c-border)] rounded-full relative opacity-50 cursor-not-allowed shrink-0"
                  >
                    <div className="w-5 h-5 bg-[var(--c-card)] rounded-full absolute left-1 top-1 shadow-sm"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <div className="font-sans text-sm font-bold text-[var(--c-text)]">Hide Temporary Reflections</div>
                    <div className="font-sans text-xs font-medium text-[var(--c-subtext)] opacity-80 mt-1">Don't show in patterns until promoted</div>
                  </div>
                  <button 
                    onClick={() => updatePreference('hideTemporaryReflections', !prefs.hideTemporaryReflections)}
                    className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${prefs.hideTemporaryReflections ? 'bg-[var(--c-text)]' : 'bg-[var(--c-border)]'}`}
                  >
                    <div className={`w-5 h-5 bg-[var(--c-card)] rounded-full absolute top-1 shadow-sm transition-all ${prefs.hideTemporaryReflections ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Data Ownership */}
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] ml-2 mt-8">
          Data Ownership
        </h2>

        <div className="surface-glass rounded-[1.5rem] p-2">
          <button 
            onClick={handleExportData}
            disabled={exporting}
            className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Download size={18} className="text-[var(--c-text)] opacity-80" />
              <span className="font-sans text-sm font-bold text-[var(--c-text)]">
                {exporting ? 'Preparing Export...' : 'Export My Data'}
              </span>
            </div>
          </button>
          <div className="h-px bg-[var(--c-border)] mx-4 my-1 opacity-50" />
          <button 
            onClick={() => showToast('Account deletion coming soon. Contact support.')}
            className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[#D96677]/10 transition-colors group opacity-60"
          >
            <div className="flex items-center space-x-4">
              <Trash2 size={18} className="text-[#D96677]/70 group-hover:text-[#D96677]" />
              <span className="font-sans text-sm font-bold text-[#D96677]/90 group-hover:text-[#D96677]">Delete Data</span>
            </div>
          </button>
        </div>

        {/* Account */}
        <h2 className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] ml-2 mt-8">
          Account
        </h2>

        <div className="surface-glass rounded-[1.5rem] p-2">
          <button
            onClick={() => logout()}
            id="logout-btn"
            className="w-full flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-[var(--c-text)]/5 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <LogOut size={18} className="text-[var(--c-text)] opacity-60" />
              <span className="font-sans text-sm font-medium text-[var(--c-text)]">Log Out</span>
            </div>
          </button>
        </div>

        {/* Branding Footer */}
        <div className="mt-12 mb-8 text-center flex flex-col items-center justify-center opacity-40">
          <p className="font-serif text-sm text-[var(--c-text)] mb-1">MoodMirror v1.0</p>
          <p className="font-sans text-[0.65rem] tracking-wider uppercase text-[var(--c-text)]">
            © Sunshine Pvt. Ltd.<br/>All Rights Reserved.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showThemeSelector && (
          <ThemeSelector onClose={() => setShowThemeSelector(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SelfView;
