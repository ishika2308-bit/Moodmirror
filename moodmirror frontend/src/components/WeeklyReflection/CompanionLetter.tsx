import React from 'react';
import { motion } from 'motion/react';
import { WeeklyReflectionData } from './mockData';

const CompanionLetter: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        {/* Glass envelope effect */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl" />
        
        {/* Ambient glow behind text */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="relative z-10 p-10 space-y-8 font-serif text-[1.4rem] leading-[1.65] text-white/90 tracking-tight">
          <p className="font-medium text-white">{data.letter.greeting}</p>
          
          {data.letter.paragraphs.map((paragraph, idx) => (
            <motion.p 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.3 + (idx * 0.2), duration: 1 }}
              className={idx === data.letter.paragraphs.length - 1 ? "italic text-[#FFD89B] font-medium pt-4" : "text-white/80"}
            >
              {paragraph}
            </motion.p>
          ))}
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.5, duration: 1 }}
            className="pt-12 text-xs font-sans uppercase tracking-[0.2em] text-white/50 text-right"
          >
            {data.letter.signOff}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default CompanionLetter;
