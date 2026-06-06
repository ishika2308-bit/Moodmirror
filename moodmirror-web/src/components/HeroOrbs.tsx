// React import not needed with JSX transform
import { motion } from 'framer-motion';

export const HeroOrbs = ({ isTransitioning = false, introStage = 'done' }: { isTransitioning?: boolean, introStage?: 'assembling' | 'floating' | 'done' }) => {
  
  // The colors loop for the soft gradients.
  const colorLoop1 = [
    'radial-gradient(circle at 25% 25%, rgba(250,245,255,1) 0%, rgba(200,190,220,0.8) 40%, rgba(140,160,200,0.9) 80%, rgba(180,150,190,1) 100%)',
    'radial-gradient(circle at 25% 25%, rgba(245,250,255,1) 0%, rgba(180,190,230,0.8) 40%, rgba(160,140,210,0.9) 80%, rgba(150,180,200,1) 100%)',
    'radial-gradient(circle at 25% 25%, rgba(255,245,250,1) 0%, rgba(220,180,200,0.8) 40%, rgba(150,170,220,0.9) 80%, rgba(190,160,180,1) 100%)',
  ];

  const colorLoop2 = [
    'radial-gradient(circle at 25% 25%, rgba(255,255,255,1) 0%, rgba(210,200,230,0.8) 50%, rgba(150,170,210,0.9) 80%, rgba(160,140,180,1) 100%)',
    'radial-gradient(circle at 25% 25%, rgba(250,255,255,1) 0%, rgba(190,210,240,0.8) 50%, rgba(170,150,200,0.9) 80%, rgba(140,160,190,1) 100%)',
    'radial-gradient(circle at 25% 25%, rgba(255,250,255,1) 0%, rgba(230,200,210,0.8) 50%, rgba(160,180,200,0.9) 80%, rgba(180,150,170,1) 100%)',
  ];

  const colorLoop3 = [
    'radial-gradient(circle at 25% 25%, rgba(255,255,255,1) 0%, rgba(200,195,220,0.8) 50%, rgba(160,175,210,0.9) 80%, rgba(170,150,190,1) 100%)',
    'radial-gradient(circle at 25% 25%, rgba(255,255,250,1) 0%, rgba(190,210,220,0.8) 50%, rgba(150,160,200,0.9) 80%, rgba(160,170,190,1) 100%)',
    'radial-gradient(circle at 25% 25%, rgba(255,255,255,1) 0%, rgba(220,190,200,0.8) 50%, rgba(170,160,210,0.9) 80%, rgba(180,170,190,1) 100%)',
  ];

  return (
    <motion.div 
      layout="position"
      className="relative mx-auto mb-10 flex items-center justify-center w-full" 
      style={{ height: '160px' }}
      transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div 
        className="relative flex items-center justify-center"
        style={{ width: '160px', height: '140px' }}
      >
        {/* Orb 1: Main (Left) */}
        <motion.div
          style={{ 
            boxShadow: 'inset -8px -8px 20px rgba(100,80,120,0.4), inset 8px 8px 20px rgba(255,255,255,1), 0 15px 25px -5px rgba(100,110,140,0.4), 0 8px 10px -5px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            zIndex: 20 
          }}
          className={`absolute rounded-full ${isTransitioning ? 'inset-auto' : ''}`}
          initial={{ 
            x: introStage === 'assembling' ? -80 : 0, 
            y: introStage === 'assembling' ? -60 : 0, 
            width: introStage === 'assembling' ? '85px' : '200px', 
            height: introStage === 'assembling' ? '85px' : '200px',
            left: 0,
            top: '0px'
          }}
          animate={
            isTransitioning 
              ? { scale: 1.1, width: '220px', height: '220px', x: 25, y: 5, background: colorLoop1[0] } 
              : { 
                  background: introStage === 'assembling' ? colorLoop1[0] : colorLoop1,
                  y: introStage === 'done' ? [0, -12, 0] : 0,
                  scale: introStage === 'done' ? [1, 1.02, 1] : 1,
                  width: '200px', 
                  height: '200px',
                  x: 0,
                  left: -50,
                  top: '-20px'
                }
          }
          transition={{ 
            duration: isTransitioning ? 1.0 : introStage === 'assembling' ? 3 : 8, 
            repeat: isTransitioning || introStage === 'assembling' ? 0 : Infinity, 
            ease: 'easeInOut' 
          }}
        >
          {/* Glossy highlight */}
          <div className="absolute top-4 left-6 w-16 h-8 bg-white rounded-full rotate-[-30deg] blur-[2px] opacity-60 mix-blend-overlay" />
        </motion.div>

        {/* Orb 2: Medium (Top Right) */}
        <motion.div
          style={{ 
            boxShadow: 'inset -5px -5px 15px rgba(100,80,120,0.3), inset 5px 5px 15px rgba(255,255,255,1), 0 10px 20px -5px rgba(100,110,140,0.3), 0 4px 6px -2px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            zIndex: 10 
          }}
          className="absolute rounded-full"
          initial={{ 
            x: introStage === 'assembling' ? 100 : 0, 
            y: introStage === 'assembling' ? 50 : 0, 
            width: introStage === 'assembling' ? '50px' : '140px', 
            height: introStage === 'assembling' ? '50px' : '140px',
            opacity: introStage === 'assembling' ? 0 : 1,
            right: '-10px',
            top: '2px'
          }}
          animate={
            isTransitioning 
              ? { scale: 1, width: '140px', height: '140px', top: '50%', right: '50%', x: 40, y: -50, background: colorLoop2[0] } 
              : { 
                  background: introStage === 'assembling' ? colorLoop2[0] : colorLoop2,
                  opacity: 1,
                  y: introStage === 'done' ? [0, 10, 0] : 0,
                  x: 0,
                  scale: introStage === 'done' ? [1, 1.03, 1] : 1,
                  width: '140px', 
                  height: '140px',
                  right: '-60px',
                  top: '-40px'
                }
          }
          transition={{ 
            duration: isTransitioning ? 1.0 : introStage === 'assembling' ? 3 : 7.5, 
            repeat: isTransitioning || introStage === 'assembling' ? 0 : Infinity, 
            ease: 'easeInOut',
            delay: isTransitioning ? 0.1 : introStage === 'assembling' ? 0.2 : 0.5 
          }}
        >
          {/* Glossy highlight */}
          <div className="absolute top-3 left-4 w-10 h-5 bg-white rounded-full rotate-[-30deg] blur-[2px] opacity-60 mix-blend-overlay" />
        </motion.div>

        {/* Orb 3: Small (Bottom Right) */}
        <motion.div
          style={{ 
            boxShadow: 'inset -3px -3px 8px rgba(100,80,120,0.3), inset 3px 3px 8px rgba(255,255,255,1), 0 8px 15px -4px rgba(100,110,140,0.3), 0 2px 4px -1px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            zIndex: 30 
          }}
          className="absolute rounded-full"
          initial={{ 
            x: introStage === 'assembling' ? 60 : 0, 
            y: introStage === 'assembling' ? 120 : 0,
            width: introStage === 'assembling' ? '25px' : '70px',
            height: introStage === 'assembling' ? '25px' : '70px',
            opacity: introStage === 'assembling' ? 0 : 1,
            right: '15px',
            bottom: '25px'
          }}
          animate={
            isTransitioning 
              ? { scale: 1, width: '70px', height: '70px', bottom: '50%', right: '50%', x: 50, y: 10, background: colorLoop3[0] } 
              : { 
                  background: introStage === 'assembling' ? colorLoop3[0] : colorLoop3,
                  opacity: 1,
                  y: introStage === 'done' ? [0, -8, 0] : 0,
                  x: 0,
                  scale: introStage === 'done' ? [1, 1.05, 1] : 1,
                  width: '70px', 
                  height: '70px',
                  right: '-10px',
                  bottom: '-20px'
                }
          }
          transition={{ 
            duration: isTransitioning ? 1.0 : introStage === 'assembling' ? 3 : 6, 
            repeat: isTransitioning || introStage === 'assembling' ? 0 : Infinity, 
            ease: 'easeInOut',
            delay: isTransitioning ? 0.2 : introStage === 'assembling' ? 0.4 : 1.2 
          }}
        >
          {/* Glossy highlight */}
          <div className="absolute top-2 left-3 w-6 h-3 bg-white rounded-full rotate-[-30deg] blur-[1px] opacity-60 mix-blend-overlay" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
