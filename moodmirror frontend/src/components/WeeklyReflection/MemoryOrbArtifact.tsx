import React from 'react';
import { motion } from 'motion/react';
import { WeeklyReflectionData } from './mockData';

const MemoryOrbArtifact: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 relative pb-24">
      <motion.div
        id="shareable-orb-card"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="w-full max-w-sm aspect-[4/5] rounded-[2.5rem] bg-white/5 border border-white/20 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* The Collectible Orb */}
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-48 h-48 rounded-full blur-[2px] opacity-90 mix-blend-screen"
          style={{ background: data.orbGradient, top: '25%' }}
        />
        <div className="absolute top-[25%] w-48 h-48 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner" />

        <div className="absolute bottom-12 left-0 right-0 text-center z-10 px-6">
          <h2 className="font-serif text-3xl text-white/90 mb-2">Your Weekly Orb</h2>
          <p className="font-sans text-xs uppercase tracking-widest text-white/50 mb-6">
            {data.dateRange}
          </p>
          <div className="flex justify-center gap-2">
            {data.dnaEvolution.slice(0,2).map(d => (
              <span key={d.trait} className="px-3 py-1 rounded-full bg-white/10 text-[0.6rem] uppercase tracking-wider text-white/70">
                {d.trait}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-8 text-center font-sans text-xs uppercase tracking-widest text-white/40 max-w-[200px]"
      >
        Your reflection is complete. Take a breath.
      </motion.p>
    </div>
  );
};

export default MemoryOrbArtifact;
