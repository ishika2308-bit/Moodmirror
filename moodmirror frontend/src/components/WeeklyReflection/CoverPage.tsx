import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { WeeklyReflectionData } from './mockData';

const CoverPage: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center p-8 overflow-hidden">
      
      {/* The Central Orb */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative w-64 h-64 mb-12"
      >
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-0 rounded-full blur-[2px] opacity-90 shadow-[0_0_80px_rgba(255,255,255,0.2)]"
          style={{ background: data.orbGradient }}
        />
        {/* Inner glow */}
        <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner" />
      </motion.div>

      {/* Typography */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="text-center z-10"
      >
        <h2 className="font-sans text-[0.65rem] uppercase font-bold tracking-[0.3em] text-white/50 mb-4">
          {data.dateRange}
        </h2>
        <h1 className="font-serif text-5xl tracking-tight text-white/90 mb-6 drop-shadow-lg">
          Your Weekly<br/>Reflection
        </h1>
        <p className="font-sans text-sm text-white/60 tracking-wide font-light">
          A personal letter from {data.companionName}
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[0.6rem] uppercase tracking-widest text-white/40">Scroll to open</span>
        <motion.div 
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </div>
  );
};

export default CoverPage;
