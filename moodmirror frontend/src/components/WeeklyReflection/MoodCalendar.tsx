import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { WeeklyReflectionData } from './mockData';

const MoodCalendar: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
  const [selectedDay, setSelectedDay] = useState<WeeklyReflectionData['moodCalendar'][0] | null>(null);

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
          Heatmap
        </h3>
        <h2 className="font-serif text-3xl text-white/90">
          Weekly Mood Calendar
        </h2>
      </motion.div>

      {/* GitHub Style Heatmap Blocks */}
      <div className="flex gap-3 items-end h-32 mb-8">
        {data.moodCalendar.map((day, idx) => (
          <motion.button
            key={day.date}
            onClick={() => setSelectedDay(day)}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-lg flex flex-col items-center justify-center relative group"
            style={{ backgroundColor: day.color }}
          >
            {/* Subtle glow */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-50 transition-opacity blur-md" style={{ backgroundColor: day.color }} />
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3 text-center">
        {data.moodCalendar.map((day) => (
          <div key={`label-${day.date}`} className="w-10 font-sans text-[0.5rem] uppercase tracking-widest text-white/40">
            {day.dayOfWeek}
          </div>
        ))}
      </div>

      {/* Mobile-Friendly Bottom Sheet */}
      <AnimatePresence>
        {selectedDay && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl z-[70] p-8 border-t border-white/10 shadow-2xl"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-white/50 mb-1">{selectedDay.date}</p>
                  <h3 className="font-serif text-3xl" style={{ color: selectedDay.color }}>{selectedDay.mood}</h3>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <p className="font-sans text-white/80 leading-relaxed text-sm">
                "{selectedDay.summary}"
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodCalendar;
