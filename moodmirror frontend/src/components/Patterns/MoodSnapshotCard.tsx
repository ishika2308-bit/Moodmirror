import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { Music, ArrowUpRight } from 'lucide-react';
import type { AnalysisResult } from '../../types';

interface MoodSnapshotCardProps {
  analysis: AnalysisResult;
  companionName: string;
  weather: string;
  spotifyTrack: {
    name: string;
    artist: string;
    albumArt: string;
    url: string;
    explanation: string;
  } | null;
  isLoadingTrack?: boolean;
}

const MoodSnapshotCard = forwardRef<HTMLDivElement, MoodSnapshotCardProps>(
  ({ analysis, companionName, weather, spotifyTrack, isLoadingTrack = false }, ref) => {
    // Generate a beautiful gradient based on the mood score/primary emotion
    const score = analysis.moodScore;
    let gradient = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'; // default Calm
    if (score >= 80) gradient = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'; // Hopeful
    else if (score < 50) gradient = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'; // Stressed/Low
    else if (score >= 50 && score < 70) gradient = 'linear-gradient(135deg, #8baaaa 0%, #ae8b9c 100%)'; // Reflective

    return (
      <div 
        ref={ref} 
        className="w-full max-w-sm aspect-[4/5] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between"
        style={{ background: gradient }}
      >
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        
        {/* Top Section */}
        <div className="relative z-10">
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
            Today's Vibe
          </p>
          <h2 className="font-serif text-4xl mb-1 tracking-tight drop-shadow-sm capitalize">
            {analysis.primaryEmotion || 'Reflective'}
          </h2>
          <p className="font-sans text-sm font-medium text-white/90 capitalize flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/80" /> {weather}
          </p>
        </div>

        {/* Companion Message */}
        <div className="relative z-10 bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-inner my-6">
          <p className="font-serif italic text-lg leading-snug">
            "{analysis.summary}"
          </p>
          <p className="font-sans text-xs uppercase tracking-widest text-white/60 mt-3 text-right">
            — {companionName}
          </p>
        </div>

        {/* Spotify Section */}
        <div className="relative z-10 mt-auto">
          {spotifyTrack ? (
            <div className="bg-black/30 backdrop-blur-xl rounded-[1.5rem] p-4 flex items-center gap-4 border border-white/20">
              <img 
                src={spotifyTrack.albumArt} 
                alt="Album Art" 
                className="w-14 h-14 rounded-xl object-cover shadow-md"
                crossOrigin="anonymous" 
              />
              <div className="flex-1 overflow-hidden">
                <h3 className="font-serif text-lg truncate drop-shadow-sm">{spotifyTrack.name}</h3>
                <p className="font-sans text-xs text-white/70 truncate">{spotifyTrack.artist}</p>
              </div>
              <Music className="text-white/50 w-5 h-5 shrink-0" />
            </div>
          ) : isLoadingTrack ? (
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-center gap-3 border border-white/10 animate-pulse">
              <Music className="w-4 h-4 opacity-50" />
              <span className="font-sans text-xs uppercase tracking-widest opacity-70">Curating track...</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

export default MoodSnapshotCard;
