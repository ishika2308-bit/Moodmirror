import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Download, Share2, RefreshCw, Loader2, Music } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import MoodSnapshotCard from './MoodSnapshotCard';
import { 
  initiateSpotifyLogin, 
  getValidAccessToken, 
  fetchSpotifyProfileAndStats, 
  saveSpotifyProfileToFirestore, 
  getSpotifyProfileFromFirestore, 
  searchSpotifyTrack 
} from '../../services/spotifyService';
import { generateSpotifyRecommendationParams } from '../../lib/geminiService';
import { useAuth } from '../../context/AuthContext';

interface MoodSnapshotGeneratorProps {
  onClose: () => void;
  latestEntry: any; // We'll pass today's entry
}

export default function MoodSnapshotGenerator({ onClose, latestEntry }: MoodSnapshotGeneratorProps) {
  const { currentUser, userProfile } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [spotifyProfile, setSpotifyProfile] = useState<any>(null);
  const [spotifyTrack, setSpotifyTrack] = useState<any>(null);
  const [error, setError] = useState('');

  // Determine emotional state
  const analysis = latestEntry?.analysis;
  const primaryEmotion = analysis?.primaryEmotion || 'Reflective';
  const weather = analysis?.weather || 'Golden Hour'; // In a real app, map score to weather string

  useEffect(() => {
    checkSpotifyStatus();
  }, []);

  const checkSpotifyStatus = async () => {
    if (!currentUser) return;
    try {
      // 1. Check local token
      const token = await getValidAccessToken();
      
      // 2. Check Firestore for profile
      let profile = await getSpotifyProfileFromFirestore(currentUser.uid);
      
      if (!profile && token) {
        // Connected but no profile saved yet, fetch and save
        setIsConnecting(true);
        const stats = await fetchSpotifyProfileAndStats(token);
        await saveSpotifyProfileToFirestore(currentUser.uid, stats);
        profile = stats;
        setIsConnecting(false);
      }

      setSpotifyProfile(profile);

      if (profile && token && isGenerating) {
        await generateRecommendation(token, profile);
      } else {
        setIsGenerating(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to Spotify. Please try again.');
      setIsGenerating(false);
      setIsConnecting(false);
    }
  };

  const handleConnectSpotify = async () => {
    setIsConnecting(true);
    await initiateSpotifyLogin();
    // The page will redirect to Spotify, so execution stops here.
  };

  const generateRecommendation = async (token: string, profile: any) => {
    setIsGenerating(true);
    try {
      const params = await generateSpotifyRecommendationParams(primaryEmotion, weather, profile);
      const track = await searchSpotifyTrack(token, params.searchGenres?.[0] || '', params.searchGenres || []);
      
      if (track) {
        setSpotifyTrack({ ...track, explanation: params.explanation });
      } else {
        setError('Could not find a matching track.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate recommendation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshSong = async () => {
    const token = await getValidAccessToken();
    if (token && spotifyProfile) {
      await generateRecommendation(token, spotifyProfile);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `mood-snapshot-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Failed to save image.');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'mood-snapshot.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Mood Snapshot',
          text: 'Check out my emotional reflection today.',
          files: [file]
        });
      } else {
        handleDownload(); // Fallback
      }
    } catch (err) {
      console.error('Share failed', err);
      alert('Sharing is not supported on this device.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50 text-white"
      >
        <X size={20} />
      </button>

      {/* Main Content Area */}
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Card is ALWAYS rendered now */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full relative"
        >
          <MoodSnapshotCard 
            ref={cardRef}
            analysis={analysis}
            companionName={userProfile?.companionName || 'Mira'}
            weather={weather}
            spotifyTrack={spotifyTrack}
            isLoadingTrack={isGenerating || isConnecting}
          />
          
          {(isGenerating || isConnecting) && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-[2rem] flex items-center justify-center flex-col gap-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-white/80 text-sm font-sans tracking-widest uppercase">
                {isConnecting ? 'Connecting...' : 'Curating your vibe...'}
              </p>
            </div>
          )}
        </motion.div>

        {/* State 1: Not Connected */}
        {!spotifyProfile && !isGenerating && !isConnecting && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl w-full text-center"
          >
            <Music className="w-6 h-6 text-[#1DB954] mx-auto mb-2" />
            <h3 className="font-serif text-base text-white mb-1">Add a Soundtrack</h3>
            <p className="font-sans text-[0.65rem] text-white/70 mb-3 leading-relaxed">
              Connect Spotify to attach a personalized song to your snapshot.
            </p>
            <button 
              onClick={handleConnectSpotify}
              className="w-full py-2.5 rounded-full bg-[#1DB954] text-black font-bold text-[0.65rem] uppercase tracking-wider hover:bg-[#1ed760] transition-colors"
            >
              Connect Spotify
            </button>
          </motion.div>
        )}

            {/* "Why This Song?" Section */}
            {spotifyTrack && spotifyTrack.explanation && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl w-full text-left"
              >
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#1DB954] mb-2">
                  Why This Song?
                </p>
                <p className="font-serif text-sm text-white/90 leading-relaxed italic">
                  "{spotifyTrack.explanation}"
                </p>
              </motion.div>
            )}

            {/* Actions */}
            {!isGenerating && !isConnecting && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex items-center gap-4 mt-6 w-full"
              >
                {spotifyProfile && (
                  <button 
                    onClick={handleRefreshSong}
                    className="flex-1 py-3.5 rounded-xl bg-white/10 text-white font-sans text-sm font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                )}
                <button 
                  onClick={handleDownload}
                  className="flex-1 py-3.5 rounded-xl bg-white text-black font-sans text-sm font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Save
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 py-3.5 rounded-xl bg-[var(--theme-color)] text-white font-sans text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Share2 size={16} /> Share
                </button>
              </motion.div>
            )}
          
        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
