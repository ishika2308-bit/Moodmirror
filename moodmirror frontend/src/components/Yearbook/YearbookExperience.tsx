import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Heart, Activity, Camera } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';

export function YearbookExperience({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useDashboard();
  const [currentSlide, setCurrentSlide] = useState(0);

  // We only show yearbook when we have at least *some* data, 
  // but let's assume we derive the "Year in Review" from current data points.

  const slides = [
    {
      id: 'intro',
      title: 'Your Year in Reflection',
      subtitle: '2026',
      icon: <Sparkles size={48} className="text-yellow-400 mb-6" />,
      content: 'Let\'s take a look back at the moments, feelings, and people that shaped your year.'
    },
    {
      id: 'mood',
      title: 'Your Emotional Landscape',
      subtitle: 'The feeling of the year',
      icon: <Activity size={48} className="text-blue-400 mb-6" />,
      content: data?.moodProfile?.primaryDrivers?.length 
        ? `You were deeply driven by ${data.moodProfile.primaryDrivers.join(', ')}.`
        : 'Your emotions ebbed and flowed, but you always kept reflecting.'
    },
    {
      id: 'people',
      title: 'The People Who Mattered',
      subtitle: 'Connections',
      icon: <Heart size={48} className="text-pink-400 mb-6" />,
      content: data?.memoryProfile?.topPeople?.length 
        ? `You mentioned ${data.memoryProfile.topPeople[0].name} the most this year.`
        : 'You spent a lot of time exploring your own inner world.'
    },
    {
      id: 'outro',
      title: 'A Year of Growth',
      subtitle: 'Keep moving forward',
      icon: <Camera size={48} className="text-green-400 mb-6" />,
      content: 'Here\'s to another year of self-discovery and mindfulness.'
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
    else onClose();
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <Sparkles className="animate-spin text-white opacity-50" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col items-center justify-center p-6">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
      >
        <X size={20} />
      </button>

      {/* Progress Bar */}
      <div className="absolute top-6 left-6 right-20 flex gap-2">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: '0%' }}
              animate={{ width: i <= currentSlide ? '100%' : '0%' }}
              transition={{ duration: 0.5 }}
            />
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center text-center relative mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center w-full"
          >
            {slides[currentSlide].icon}
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-2 leading-tight">
              {slides[currentSlide].title}
            </h2>
            <h3 className="font-sans text-xs uppercase tracking-[0.3em] opacity-60 mb-8 text-yellow-200">
              {slides[currentSlide].subtitle}
            </h3>
            <p className="font-sans text-lg md:text-xl opacity-90 leading-relaxed max-w-xs">
              {slides[currentSlide].content}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="w-full max-w-md flex justify-between mt-auto mb-6">
        <button 
          onClick={prevSlide}
          className={`p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="p-4 rounded-full bg-white hover:bg-gray-200 text-black transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
