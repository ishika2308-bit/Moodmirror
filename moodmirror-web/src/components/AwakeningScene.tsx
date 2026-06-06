import React from 'react';
import MagicRings from './MagicRings';
import { MirrorCore } from './MirrorCore';
import { motion } from 'framer-motion';

interface AwakeningSceneProps {
  isAwake: boolean;
  onAwake: () => void;
}

export const AwakeningScene: React.FC<AwakeningSceneProps> = ({ isAwake, onAwake }) => {
  return (
    <div 
      className="absolute inset-0 w-full h-full cursor-pointer z-0 overflow-hidden"
      onClick={() => {
        if (!isAwake) onAwake();
      }}
    >
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{
          opacity: isAwake ? 0.6 : 0.2,
          scale: isAwake ? 1.05 : 1
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <MagicRings
          color="#BFA6D8"
          colorTwo="#E6C280"
          ringCount={8}
          speed={isAwake ? 1.5 : 0.5}
          attenuation={isAwake ? 8 : 15}
          lineThickness={2}
          baseRadius={0.15}
          radiusStep={0.1}
          scaleRate={0.05}
          opacity={1}
          blur={0}
          noiseAmount={0.05}
          followMouse={true}
          mouseInfluence={0.1}
          hoverScale={1.1}
          parallax={0.03}
        />
      </motion.div>
      
      {/* Center the MirrorCore */}
      <motion.div 
        className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none pb-20"
        animate={{
            scale: isAwake ? 1.5 : 1,
            opacity: isAwake ? 0 : 1,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <MirrorCore 
          mirrorState="idle"
        />
      </motion.div>
      
      {/* Ambient Glow behind the scene */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] rounded-full bg-[#E6C280]/20 blur-[120px] pointer-events-none transition-all duration-3000 ${
          isAwake ? 'scale-150 opacity-60' : 'scale-100 opacity-30'
        }`}
      />
    </div>
  );
};
