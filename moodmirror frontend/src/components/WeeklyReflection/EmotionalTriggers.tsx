import React from 'react';
import { motion } from 'motion/react';
import { WeeklyReflectionData } from './mockData';

const EmotionalTriggers: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
        className="w-full max-w-md text-center mb-16"
      >
        <h3 className="font-sans text-[0.65rem] uppercase font-bold tracking-[0.2em] text-white/50 mb-4">
          Emotional Triggers
        </h3>
        <h2 className="font-serif text-3xl text-white/90">
          Energy Flow
        </h2>
      </motion.div>

      <div className="w-full max-w-md grid grid-cols-2 gap-6">
        {/* Energy Givers */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h4 className="font-sans text-xs uppercase tracking-widest text-[#FFD89B] border-b border-[#FFD89B]/30 pb-3">
            Energy Givers
          </h4>
          <ul className="space-y-4">
            {data.triggers.givers.map((giver, idx) => (
              <li key={idx} className="font-serif text-lg text-white/90">{giver}</li>
            ))}
          </ul>
        </motion.div>

        {/* Energy Drainers */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h4 className="font-sans text-xs uppercase tracking-widest text-[#A1C4FD] border-b border-[#A1C4FD]/30 pb-3">
            Energy Drainers
          </h4>
          <ul className="space-y-4">
            {data.triggers.drainers.map((drainer, idx) => (
              <li key={idx} className="font-serif text-lg text-white/70">{drainer}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default EmotionalTriggers;
