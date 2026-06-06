import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploaderProps {
  onPhotoAdd: (file: File) => void;
  onPhotoRemove: (index: number) => void;
  selectedPhotos: { file: File; previewUrl: string }[];
  variant?: 'default' | 'icon';
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ 
  onPhotoAdd, 
  onPhotoRemove, 
  selectedPhotos,
  variant = 'default'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPhotoAdd(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onPhotoAdd(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={variant === 'icon' ? "inline-block" : "w-full mt-4"}>
      {/* File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Upload Button */}
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="p-2 rounded-full hover:bg-[var(--c-text)]/10 text-[var(--c-text)] opacity-70 hover:opacity-100 transition-colors"
        >
          <Camera size={20} />
        </button>
      ) : (
        <div className="flex items-center justify-center w-full">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer
              ${isDragging 
                ? 'bg-[#E6C280]/20 text-[#5A4A35] border border-[#E6C280]/40' 
                : 'bg-[var(--c-card)] text-[var(--c-text)] border border-[var(--c-border)] hover:bg-white/20'
              }
            `}
          >
            <ImageIcon size={14} className="opacity-80" />
            <span>Attach A Moment</span>
          </button>
        </div>
      )}

      {/* Selected Photos Preview */}
      <AnimatePresence>
        {selectedPhotos.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-4 mt-6 overflow-x-auto pb-4 scrollbar-hide"
          >
            {selectedPhotos.map((photo, idx) => (
              <motion.div 
                key={photo.previewUrl}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden group"
              >
                <img 
                  src={photo.previewUrl} 
                  alt="Memory preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onPhotoRemove(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
