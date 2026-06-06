import React from 'react';
import { motion } from 'motion/react';
import { WeeklyReflectionData } from './mockData';

const EmotionalWeather: React.FC<{ data: WeeklyReflectionData }> = ({ data }) => {
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
          Visual Journey
        </h3>
        <h2 className="font-serif text-3xl text-white/90">
          Your Emotional Weather
        </h2>
      </motion.div>

      <div className="w-full max-w-md space-y-6">
        {data.weather.map((day, idx) => (
          <motion.div 
            key={day.day}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: idx * 0.1, duration: 0.8 }}
            className="flex items-center gap-6"
          >
            <div className="w-12 text-right font-sans text-xs uppercase tracking-widest text-white/40">
              {day.day}
            </div>
            
            {/* The animated weather "bar" */}
            <div className="flex-1 h-16 relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors flex items-center px-6">
              {/* Subtle animated background based on weather */}
              <div 
                className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30"
                style={{
                  background: day.state === 'Rain' ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' :
                              day.state === 'Golden Hour' ? 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)' :
                              day.state === 'Clearing Skies' ? 'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)' :
                              day.state === 'Sunrise' ? 'linear-gradient(90deg, #ff9a9e 0%, #fecfef 100%)' :
                              'linear-gradient(90deg, #8baaaa 0%, #ae8b9c 100%)' // Quiet Night / Fog
                }}
              />
              <span className="relative z-10 text-2xl mr-4 drop-shadow-md">{day.icon}</span>
              <span className="relative z-10 font-serif text-lg text-white/90 tracking-wide">{day.state}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EmotionalWeather;
