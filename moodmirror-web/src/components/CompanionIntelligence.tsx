import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Network, Sparkles, Target } from 'lucide-react';

export const CompanionIntelligence: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 1.5]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.section 
      ref={containerRef}
      className="relative w-full min-h-[150vh] flex flex-col items-center justify-center py-32 overflow-hidden"
      style={{ opacity }}
    >
      <motion.div 
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-100/50 via-transparent to-transparent pointer-events-none"
        style={{ scale: bgScale }}
      />
      
      <div className="relative z-10 max-w-5xl w-full px-6 flex flex-col md:flex-row items-center gap-16 md:gap-32">
        <div className="flex-1 space-y-8">
          <h2 className="font-serif text-4xl md:text-6xl leading-tight">Quietly observing the patterns of your life.</h2>
          <p className="font-sans text-lg opacity-60">No charts or graphs. Just soft, intelligent insights into your emotional weather, your closest relationships, and the goals you're quietly working toward.</p>
        </div>

        <div className="flex-1 w-full flex flex-col gap-6 relative">
          <IntelligenceNode 
            icon={<Target size={24} />} 
            title="Emotional Goals" 
            text="Tracking growth moments, not productivity metrics." 
            delay={0.1} 
            color="emerald"
          />
          <IntelligenceNode 
            icon={<Network size={24} />} 
            title="Relationship Reflection" 
            text="Understanding who brings you peace, and who brings stress." 
            delay={0.3} 
            color="blue"
            className="ml-8"
          />
          <IntelligenceNode 
            icon={<Sparkles size={24} />} 
            title="Emotional Weather" 
            text="Sensing the shifting atmospheric pressure of your mind." 
            delay={0.5} 
            color="amber"
          />
        </div>
      </div>
    </motion.section>
  );
};

interface NodeProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  delay: number;
  color: 'emerald' | 'blue' | 'amber';
  className?: string;
}

const IntelligenceNode: React.FC<NodeProps> = ({ icon, title, text, delay, color, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const x = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const colorMap = {
    emerald: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/20 shadow-[0_0_15px_rgba(4,120,87,0.1)]',
    blue: 'text-blue-700 bg-blue-700/10 border-blue-700/20 shadow-[0_0_15px_rgba(29,78,216,0.1)]',
    amber: 'text-amber-700 bg-amber-700/10 border-amber-700/20 shadow-[0_0_15px_rgba(180,83,9,0.1)]',
  };

  return (
    <motion.div 
      ref={ref}
      style={{ x, opacity }}
      className={`p-6 surface-glass rounded-2xl flex items-start gap-4 ${className}`}
    >
      <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-serif text-xl mb-1">{title}</h3>
        <p className="font-sans text-sm opacity-60">{text}</p>
      </div>
    </motion.div>
  );
};
