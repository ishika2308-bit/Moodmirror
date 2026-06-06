import React from 'react';
import { motion } from 'motion/react';
import { Compass } from 'lucide-react';
import { WeeklyReflectionData } from './mockData';

const GentleDirection: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
        className="w-full max-w-md p-10 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-6 opacity-80">
          <Compass size={20} className="text-[#FFD89B]" />
          <h4 className="font-sans text-xs uppercase tracking-widest text-white/70">For Next Week</h4>
        </div>
        
        <p className="font-serif text-[1.35rem] leading-relaxed text-white/90">
          {data.direction}
        </p>
      </motion.div>
    </div>
  );
};

export default GentleDirection;
