import React from 'react';
import { motion } from 'motion/react';
import { Bookmark } from 'lucide-react';
import { WeeklyReflectionData } from './mockData';

const FeaturedMemory: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
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
          Memory of the Week
        </h3>
        <h2 className="font-serif text-3xl text-white/90">
          A Moment Preserved
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full max-w-md p-10 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
      >
        {/* Subtle internal gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 opacity-60">
            <Bookmark size={16} />
            <span className="font-sans text-xs uppercase tracking-widest">{data.featuredMemory.day}</span>
          </div>
          
          <p className="font-serif text-2xl leading-relaxed text-white/90 italic">
            "{data.featuredMemory.quote}"
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default FeaturedMemory;
