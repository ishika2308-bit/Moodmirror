import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye } from 'lucide-react';
import { WeeklyReflectionData } from './mockData';

const PatternDiscoveries: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
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
          Discoveries
        </h3>
        <h2 className="font-serif text-3xl text-white/90">
          Patterns Noticed
        </h2>
      </motion.div>

      <div className="w-full max-w-md space-y-4 mb-16">
        {data.patterns.map((pattern, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: idx * 0.2, duration: 0.8 }}
            className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-4"
          >
            <Sparkles size={18} className="text-[#FFD89B] shrink-0 mt-1" />
            <p className="font-sans text-sm text-white/80 leading-relaxed">{pattern}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay: 0.8, duration: 1 }}
        className="w-full max-w-md p-8 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/20 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Eye size={20} className="text-[#A8E6CF]" />
          <h4 className="font-serif text-lg text-white/90">{data.companionName} noticed:</h4>
        </div>
        <p className="font-serif italic text-xl text-[#A8E6CF] leading-relaxed">
          "{data.observation}"
        </p>
      </motion.div>
    </div>
  );
};

export default PatternDiscoveries;
