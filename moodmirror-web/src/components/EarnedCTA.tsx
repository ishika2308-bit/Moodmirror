import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const EarnedCTA: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <motion.section 
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-center py-32"
      style={{ opacity }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#E6C280]/20 to-transparent pointer-events-none" />
      
      <motion.div 
        style={{ y, scale }}
        className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
      >
        <div className="w-16 h-16 rounded-full bg-black/5 border border-black/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,0,0,0.05)]">
          <div className="w-4 h-4 rounded-full bg-[#5A4A35] animate-pulse" />
        </div>
        
        <h2 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight">Enter the Mirror</h2>
        <p className="font-sans text-xl opacity-60 mb-12">Your sanctuary awaits. Completely private, fully local, and thoughtfully designed.</p>
        
        <button className="group relative px-8 py-4 rounded-full bg-[#5A4A35]/10 hover:bg-[#5A4A35]/15 transition-all backdrop-blur-md border border-[#5A4A35]/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5A4A35]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative font-sans tracking-widest uppercase text-sm">Download for Android</span>
        </button>
        
        <div className="mt-8 flex gap-6 text-xs font-sans uppercase tracking-widest opacity-30">
          <span>iOS (Waitlist)</span>
          <span>•</span>
          <span>Private by Design</span>
        </div>
      </motion.div>
    </motion.section>
  );
};
