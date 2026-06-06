import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Mic, Sparkles, Edit3, Check } from 'lucide-react';
import { PhotoUploader } from './PhotoUploader';

interface ReflectionReviewScreenProps {
  transcript: string;
  onTranscriptChange: (text: string) => void;
  onContinueSpeaking: () => void;
  onReflect: () => void;
  companionName: string;
  selectedPhotos: { file: File; previewUrl: string }[];
  onPhotoAdd: (file: File) => void;
  onPhotoRemove: (index: number) => void;
}


interface Token {
  text: string;
  isLowConfidence: boolean;
}

export const ReflectionReviewScreen: React.FC<ReflectionReviewScreenProps> = ({
  transcript,
  onTranscriptChange,
  onContinueSpeaking,
  onReflect,
  companionName,
  selectedPhotos,
  onPhotoAdd,
  onPhotoRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(transcript);

  // Future-proof: Tokenize text and detect low-confidence words (e.g., ending in '?' or specific names like 'ishieee')
  const tokens = useMemo<Token[]>(() => {
    return transcript.split(/(\s+)/).map(word => {
      const clean = word.trim().toLowerCase();
      const isLow = clean.endsWith('?') || clean === 'ishieee' || clean === 'mira?';
      return {
        text: word,
        isLowConfidence: isLow
      };
    });
  }, [transcript]);

  const hasLowConfidence = useMemo(() => {
    return tokens.some(t => t.isLowConfidence);
  }, [tokens]);

  const handleStartEdit = () => {
    setEditText(transcript);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onTranscriptChange(editText);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className="flex flex-col h-full w-full max-w-md mx-auto p-6 justify-between select-none"
    >
      {/* Companion Guidance Header */}
      <div className="text-center mt-10 mb-6">
        <span className="inline-block font-sans text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[var(--c-subtext)] opacity-70 mb-2">
          {companionName} Guidance
        </span>
        <h2 className="font-serif text-2xl text-[var(--c-text)] leading-relaxed italic px-2">
          "Take a moment. Would you like to add anything before we reflect?"
        </h2>
      </div>

      {/* Transcript Card */}
      <div className="flex-1 flex flex-col justify-center my-4">
        <div 
          className="rounded-[2rem] p-6 bg-[var(--c-card)] border border-[var(--c-border)] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px] max-h-[350px]"
        >
          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
              }}
              className="flex-1 w-full bg-transparent border-0 outline-none resize-none font-sans text-[0.95rem] text-[var(--c-text)] leading-relaxed focus:ring-0 p-0"
              placeholder="What are you thinking..."
              autoFocus
            />
          ) : (
            <div className="flex-1 overflow-y-auto pr-1">
              <p className="font-sans text-[0.95rem] text-[var(--c-text)] leading-relaxed font-light">
                {tokens.map((token, idx) => (
                  <span 
                    key={idx} 
                    className={token.isLowConfidence ? "border-b-2 border-dotted border-amber-500/60 bg-amber-500/5 px-0.5 rounded-sm cursor-pointer" : ""}
                    title={token.isLowConfidence ? "Click to edit transcript mistakes" : undefined}
                    onClick={token.isLowConfidence ? handleStartEdit : undefined}
                  >
                    {token.text}
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Transcript Quality Indicator */}
          {hasLowConfidence && !isEditing && (
            <div className="mt-4 pt-3 border-t border-[var(--c-border)] flex items-center justify-between">
              <span className="font-sans text-[0.6rem] uppercase tracking-widest text-amber-600 font-bold animate-pulse">
                Some words may need review
              </span>
              <span className="text-[0.55rem] text-[var(--c-subtext)] opacity-60">
                Tap underlined words to edit
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Attach a Moment / Photo uploader */}
      <div className="px-2 mb-4">
        <PhotoUploader
          selectedPhotos={selectedPhotos}
          onPhotoAdd={onPhotoAdd}
          onPhotoRemove={onPhotoRemove}
        />
      </div>

      {/* Actions (Thumb-friendly bottom layout) */}
      <div className="flex flex-col gap-3 mt-2 pb-20">
        <div className="flex gap-3">
          {/* Continue Speaking (Microphone) */}
          <button
            onClick={onContinueSpeaking}
            className="flex-1 py-4.5 rounded-full text-[0.7rem] font-bold uppercase tracking-widest bg-[var(--c-border)] text-[var(--c-text)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 border border-[var(--c-border)]"
          >
            <Mic size={14} />
            Continue Speaking
          </button>

          {/* Reflect With Companion (Gemini trigger) */}
          <button
            onClick={onReflect}
            className="flex-1 py-4.5 rounded-full text-[0.7rem] font-bold uppercase tracking-widest bg-[var(--c-text)] text-[var(--c-card)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            <Sparkles size={14} />
            Reflect
          </button>
        </div>

        {/* Edit Transcript / Save Text (Secondary Toggle) */}
        {isEditing ? (
          <button
            onClick={handleSaveEdit}
            className="w-full py-4 rounded-full text-[0.7rem] font-bold uppercase tracking-widest bg-emerald-500 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
          >
            <Check size={14} />
            Save Transcript
          </button>
        ) : (
          <button
            onClick={handleStartEdit}
            className="w-full py-4 rounded-full text-[0.7rem] font-bold uppercase tracking-widest bg-[var(--c-card)] text-[var(--c-subtext)] hover:text-[var(--c-text)] transition-colors flex items-center justify-center gap-2 border border-[var(--c-border)]"
          >
            <Edit3 size={14} />
            Edit Transcript
          </button>
        )}
      </div>
    </motion.div>
  );
};
