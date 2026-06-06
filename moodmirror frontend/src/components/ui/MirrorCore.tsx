import { motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import type { EmotionState, MirrorState } from '../../types';
import type { EmotionPalette } from '../../theme';

interface MirrorCoreProps {
  emotion?: EmotionState; // renamed from emotionState for consistency with usage
  state?: MirrorState;    // renamed from mirrorState for consistency with usage
  audioLevel?: number;       // 0-1, drives audio-reactive animations
  volumeLevels?: number[];   // for the volume bars
  onTap?: () => void;
  isWriting?: boolean;       // Legacy compat for JournalView
  overridePalette?: EmotionPalette;
}

export default function MirrorCore({ 
  emotion = 'neutral', 
  state = 'idle',
  audioLevel = 0,
  volumeLevels = [],
  onTap,
  isWriting = false,
  overridePalette,
}: MirrorCoreProps) {
  const { getPalette } = useTheme();
  const theme = overridePalette || getPalette(emotion);
  const colors = theme.coreColors;

  // Derive animation parameters from mirror state
  const isActive = state === 'listening' || isWriting;
  const isProcessing = state === 'processing';
  const isReflecting = state === 'reflecting';

  // Audio-reactive scale boost (0 to 0.15 range)
  const audioScale = isActive ? audioLevel * 0.15 : 0;
  // Audio-reactive glow opacity boost
  const audioGlow = isActive ? 0.4 + audioLevel * 0.5 : isProcessing ? 0.7 : 0.4;

  // Core size varies by state
  const coreBaseScale = isProcessing ? 0.9 : isReflecting ? 1.05 : 1;

  return (
    <motion.div 
      className="relative w-64 h-64 mx-auto flex items-center justify-center cursor-pointer select-none"
      onTap={onTap}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full mix-blend-multiply"
        style={{
          background: `radial-gradient(circle, ${colors[0]}88 0%, transparent 75%)`,
          filter: 'blur(30px)'
        }}
        animate={{
          scale: isActive 
            ? [1 + audioScale, 1.15 + audioScale, 1 + audioScale] 
            : isProcessing
              ? [1.1, 1.2, 1.1]
              : [1, 1.05, 1],
          opacity: [audioGlow - 0.1, audioGlow, audioGlow - 0.1]
        }}
        transition={{
          duration: isActive ? 2 : isProcessing ? 3 : 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Outer ambient glow 2 */}
      <motion.div
        className="absolute inset-0 rounded-full mix-blend-color-burn"
        style={{
          background: `radial-gradient(circle at 70% 70%, ${colors[1]}66 0%, transparent 70%)`,
          filter: 'blur(20px)'
        }}
        animate={{
          scale: isProcessing ? [1.05, 1.15, 1.05] : [1, 1.1, 1],
          rotate: isProcessing ? 360 : 0,
        }}
        transition={{
          duration: isProcessing ? 4 : 7,
          repeat: Infinity,
          ease: isProcessing ? "linear" : "easeInOut"
        }}
      />

      {/* Particle ring — visible during listening & processing */}
      {(isActive || isProcessing) && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const particleRadius = isProcessing ? 70 : 90 + audioLevel * 20;
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: colors[0], opacity: 0.6 }}
                animate={{
                  x: Math.cos(angle) * particleRadius,
                  y: Math.sin(angle) * particleRadius,
                  scale: isProcessing ? [1, 0.5, 1] : [0.8 + audioLevel * 0.5, 1.2, 0.8 + audioLevel * 0.5],
                  opacity: isProcessing ? [0.3, 0.8, 0.3] : [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: isProcessing ? 2 : 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              />
            );
          })}
        </>
      )}

      {/* Internal core - glass/liquid bubble */}
      <motion.div
        className="w-48 h-48 rounded-full relative overflow-hidden backdrop-blur-3xl"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)`,
          boxShadow: `inset 0 0 40px rgba(255,255,255,0.8), inset 20px 0 40px rgba(255,255,255,0.4), 0 10px 40px rgba(0,0,0,0.05)`,
          border: '1px solid rgba(255,255,255,0.8)'
        }}
        animate={{
          rotate: isActive ? [0, 8, -4, 0] : isProcessing ? [0, 360] : [0, 4, -2, 0],
          scale: isActive 
            ? [0.96 + audioScale, 1.04 + audioScale, 0.96 + audioScale]
            : [coreBaseScale * 0.98, coreBaseScale * 1.02, coreBaseScale * 0.98],
          borderRadius: isActive 
            ? ['50%', '45% 55% 48% 52%', '52% 48% 55% 45%', '50%'] 
            : isProcessing
              ? ['50%', '47% 53% 50% 50%', '50% 50% 53% 47%', '50%']
              : ['50%', '48% 52% 51% 49%', '51% 49% 49% 51%', '50%']
        }}
        transition={{
          duration: isActive ? 3 : isProcessing ? 8 : 6,
          repeat: Infinity,
          ease: isProcessing ? "linear" : "easeInOut"
        }}
      >
        {/* Liquid blob 1 */}
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] rounded-[40%_60%_70%_30%] mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at 40% 40%, ${colors[1]}, transparent 60%)`,
            filter: 'blur(10px)'
          }}
          animate={{
            rotate: 360,
            scale: isActive ? [1, 1.2 + audioLevel * 0.2, 1] : [1, 1.1, 1],
          }}
          transition={{
            duration: isActive ? 10 : 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Liquid blob 2 */}
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] rounded-[60%_40%_30%_70%] mix-blend-multiply opacity-50"
          style={{
            background: `radial-gradient(circle at 60% 60%, ${colors[0]}, transparent 60%)`,
            filter: 'blur(15px)'
          }}
          animate={{
            rotate: -360,
            scale: isActive ? [1, 1.3 + audioLevel * 0.2, 1] : [1, 1.2, 1],
          }}
          transition={{
            duration: isActive ? 12 : 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Glossy reflection highlight */}
        <div className="absolute top-4 left-6 w-16 h-10 bg-white rounded-[100%] rotate-[-30deg] blur-[2px] opacity-80 pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-6 right-8 w-20 h-6 bg-white rounded-[100%] rotate-[-20deg] blur-[4px] opacity-40 pointer-events-none mix-blend-overlay" />

        {/* Processing brightness overlay */}
        {isProcessing && (
          <motion.div 
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
