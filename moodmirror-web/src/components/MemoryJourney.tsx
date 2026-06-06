import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const memories = [
  { date: 'SEP 24', text: 'You’ve been reflecting on your internship 12 times this month. A lot of growth is happening.', offset: 0 },
  { date: 'OCT 12', text: 'Your happiest memories often feature coffee shops and quiet mornings.', offset: 50 },
  { date: 'NOV 03', text: 'You set an intention to "Protect My Mornings". You’ve honored it for two weeks.', offset: -50 }
];

export const MemoryJourney: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.section 
      ref={containerRef}
      className="relative w-full min-h-[150vh] flex flex-col items-center py-32"
      style={{ opacity }}
    >
      <motion.div 
        className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#E6C280]/40 via-transparent to-transparent pointer-events-none"
        style={{ y: bgY }}
      />
      
      <div className="relative z-10 max-w-4xl w-full px-6 flex flex-col gap-32">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl mb-6">A Living Archive</h2>
          <p className="font-sans text-lg opacity-60 max-w-xl mx-auto">Not a dashboard. Not a tracker. A private sanctuary where your reflections gradually reveal the shape of your life.</p>
        </div>

        {memories.map((memory, i) => (
          <Card key={i} memory={memory} index={i} />
        ))}
      </div>
    </motion.section>
  );
};

const Card = ({ memory, index }: { memory: any, index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const isEven = index % 2 === 0;

  return (
    <motion.div 
      ref={ref}
      style={{ y, opacity, x: memory.offset }}
      className={`relative w-full md:w-[60%] p-8 md:p-12 surface-glass rounded-3xl flex flex-col gap-4 ${isEven ? 'self-start' : 'self-end'}`}
    >
      <span className="font-sans text-xs tracking-[0.2em] uppercase opacity-50">{memory.date}</span>
      <p className="font-serif text-xl md:text-3xl leading-relaxed">"{memory.text}"</p>
    </motion.div>
  );
};
