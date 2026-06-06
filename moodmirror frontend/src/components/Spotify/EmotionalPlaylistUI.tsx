import React from 'react';
import { motion } from 'motion/react';
import { Music, ExternalLink, RefreshCw } from 'lucide-react';
import { useEmotionalPlaylist } from '../../hooks/useEmotionalPlaylist';
import { useAuth } from '../../context/AuthContext';
import { initiateSpotifyLogin } from '../../services/spotifyService';
import type { EmotionState } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface EmotionalPlaylistUIProps {
  emotion: EmotionState;
}

export function EmotionalPlaylistUI({ emotion }: EmotionalPlaylistUIProps) {
  const { userProfile } = useAuth();
  const { tracks, isLoading, error } = useEmotionalPlaylist(emotion);
  const { getPalette } = useTheme();
  const palette = getPalette(emotion);

  const isConnected = userProfile?.spotifyProfile?.spotifyConnected;

  if (!isConnected) {
    return (
      <div 
        className="w-full rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center mt-6"
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
        }}
      >
        <Music size={24} className="mb-3 opacity-60" style={{ color: palette.text }} />
        <h4 className="font-serif text-lg mb-1" style={{ color: palette.text }}>Soundtrack Your Mood</h4>
        <p className="font-sans text-xs mb-4 opacity-80" style={{ color: palette.subtext }}>
          Connect Spotify to receive a daily, emotion-aware playlist tailored to your reflections.
        </p>
        <button
          onClick={() => initiateSpotifyLogin()}
          className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm transition-transform hover:scale-105"
          style={{ background: '#1DB954', color: 'white' }}
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="w-full rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center mt-6 min-h-[140px]"
        style={{
          background: palette.cardBg,
          border: `1px solid ${palette.border}`,
        }}
      >
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        >
          <RefreshCw size={20} className="opacity-50" style={{ color: palette.text }} />
        </motion.div>
        <p className="font-sans text-xs mt-3 opacity-80 uppercase tracking-widest" style={{ color: palette.subtext }}>
          Curating Aura...
        </p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-[1.5rem] p-5 mt-6"
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music size={16} className="opacity-80" style={{ color: palette.text }} />
          <h4 className="font-serif text-lg tracking-wide" style={{ color: palette.text }}>
            Today's Aura
          </h4>
        </div>
        <span className="font-sans text-[0.65rem] font-bold uppercase tracking-widest opacity-60" style={{ color: palette.subtext }}>
          {emotion}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {tracks.map((track, idx) => (
          <a
            key={`${track.url}-${idx}`}
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 transition-colors group"
          >
            {track.albumArt ? (
              <img src={track.albumArt} alt={track.name} className="w-10 h-10 rounded-md object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-md bg-black/10 flex items-center justify-center">
                <Music size={16} className="opacity-40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold truncate" style={{ color: palette.text }}>
                {track.name}
              </p>
              <p className="font-sans text-[0.65rem] truncate opacity-80" style={{ color: palette.subtext }}>
                {track.artist}
              </p>
            </div>
            <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: palette.text }} />
          </a>
        ))}
      </div>
    </motion.div>
  );
}
