import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, X } from 'lucide-react';

interface PhotoMemory {
  id: string;
  url: string;
  caption: string;
  date: Date;
  emotion: string;
}

export function MoodBoard() {
  const { currentUser } = useAuth();
  const [photos, setPhotos] = useState<PhotoMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMemory | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'users', currentUser.uid, 'reflections'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetched: PhotoMemory[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.photos && data.photos.length > 0) {
            data.photos.forEach((photo: any) => {
              fetched.push({
                id: doc.id + '-' + photo.url,
                url: photo.url,
                caption: photo.caption || data.summary || '',
                date: data.createdAt.toDate(),
                emotion: data.primaryEmotion || 'neutral'
              });
            });
          }
        });
        setPhotos(fetched);
      } catch (err) {
        console.error('Failed to fetch photos for mood board', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPhotos();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[200px]">
        <ImageIcon className="animate-pulse opacity-20" size={32} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center opacity-60 min-h-[200px]">
        <ImageIcon size={32} className="mb-3 opacity-50" />
        <p className="font-sans text-xs">No photos yet.</p>
        <p className="font-sans text-[0.65rem] opacity-70 mt-1">Add photos to your reflections to build your mood board.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full overflow-y-auto p-2 no-scrollbar">
        <div className="columns-2 gap-2 space-y-2">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer relative group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img 
                src={photo.url} 
                alt={photo.caption} 
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <span className="text-white font-sans text-[0.6rem] font-bold uppercase tracking-wider">{photo.emotion}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative max-w-lg w-full bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
              <img src={selectedPhoto.url} alt="Memory" className="w-full h-auto max-h-[70vh] object-contain bg-black" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-widest bg-white/10 text-white/90">
                    {selectedPhoto.emotion}
                  </span>
                  <span className="text-[0.65rem] text-white/50 uppercase tracking-widest">
                    {selectedPhoto.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {selectedPhoto.caption && (
                  <p className="font-sans text-sm text-white/90 leading-relaxed">
                    {selectedPhoto.caption}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
