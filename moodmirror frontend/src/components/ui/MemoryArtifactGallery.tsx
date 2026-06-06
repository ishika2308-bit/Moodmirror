import React from 'react';
import { motion } from 'framer-motion';
import type { PhotoAttachment } from '../../types';

interface MemoryArtifactGalleryProps {
  attachments: PhotoAttachment[];
}

export const MemoryArtifactGallery: React.FC<MemoryArtifactGalleryProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="w-full flex flex-wrap gap-8 my-6 relative">
      {attachments.map((attachment, index) => (
        <ArtifactCard key={attachment.id} attachment={attachment} index={index} />
      ))}
    </div>
  );
};

const ArtifactCard: React.FC<{ attachment: PhotoAttachment; index: number }> = ({ attachment, index }) => {
  const { style, caption } = attachment.presentation;
  const rotation = index % 2 === 0 ? 3 : -2;

  switch (style) {
    case 'polaroid':
      return (
        <motion.div 
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative bg-[#FAFAFA] p-4 pb-12 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-sm"
          style={{ rotate: `${rotation}deg` }}
        >
          <img 
            src={attachment.storage.url} 
            alt="Memory Polaroid" 
            className="w-48 h-48 object-cover rounded-sm border border-black/5"
          />
          {caption && (
            <p className="absolute bottom-4 left-0 w-full text-center font-sans text-sm text-[#5A4A35] opacity-80 italic tracking-wide px-4">
              {caption}
            </p>
          )}
        </motion.div>
      );
      
    case 'sticky-note':
      return (
        <motion.div 
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative bg-[#FDF8E4] p-4 pt-8 shadow-[2px_4px_15px_rgba(0,0,0,0.1)] rounded-sm"
          style={{ rotate: `${rotation * -1.5}deg` }}
        >
          {/* Tape */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm shadow-sm rotate-[-2deg]" />
          
          <img 
            src={attachment.storage.url} 
            alt="Memory Note" 
            className="w-40 h-auto object-cover rounded-sm mix-blend-multiply opacity-90"
          />
          {caption && (
            <p className="mt-3 font-sans text-xs text-[#5A4A35] opacity-70 italic">
              {caption}
            </p>
          )}
        </motion.div>
      );
      
    case 'scrapbook':
      return (
        <motion.div 
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative p-2 bg-white shadow-md rounded-sm border border-white"
          style={{ rotate: `${rotation * 2}deg` }}
        >
          <img 
            src={attachment.storage.url} 
            alt="Scrapbook Memory" 
            className="w-40 h-40 object-cover"
          />
        </motion.div>
      );

    case 'memory-pin':
    default:
      return (
        <motion.div 
          whileHover={{ scale: 1.05, y: -5 }}
          className="relative"
          style={{ rotate: `${rotation}deg` }}
        >
          {/* Pin */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400 shadow-md z-10" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-gray-300 z-0" />
          
          <img 
            src={attachment.storage.url} 
            alt="Pinned Memory" 
            className="w-32 h-32 object-cover rounded-md shadow-lg border-2 border-white"
          />
        </motion.div>
      );
  }
};
