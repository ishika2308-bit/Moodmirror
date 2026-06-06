import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { WeeklyReflectionData } from './mockData';

const DNAEvolution: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
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
          Growth
        </h3>
        <h2 className="font-serif text-3xl text-white/90">
          DNA Evolution
        </h2>
      </motion.div>

      <div className="w-full max-w-md grid gap-6">
        {data.dnaEvolution.map((trait, idx) => (
          <motion.div
            key={trait.trait}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: idx * 0.15, duration: 0.8 }}
            className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md"
          >
            <span className="font-serif text-xl text-white/90">{trait.trait}</span>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              trait.direction === 'up' ? 'bg-green-500/20 text-green-300' :
              trait.direction === 'down' ? 'bg-blue-500/20 text-blue-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {trait.direction === 'up' ? <ArrowUpRight size={20} /> :
               trait.direction === 'down' ? <ArrowDownRight size={20} /> :
               <Minus size={20} />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DNAEvolution;
