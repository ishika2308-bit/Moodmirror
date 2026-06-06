import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './InfiniteMenu.css';

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  emotion: string;
  date: string;
  dateObj?: Date;
  gradient?: string;
}

interface InfiniteMenuProps {
  items: MenuItem[];
  onItemClick?: (item: MenuItem) => void;
  onActiveItemChange?: (item: MenuItem) => void;
}

const emotionGradients: Record<string, string> = {
  hopeful: 'linear-gradient(135deg, #FFD89B, #19547b)',
  calm: 'linear-gradient(135deg, #A8E6CF, #3D7EAA)',
  reflective: 'linear-gradient(135deg, #E2B0FF, #9F44D3)',
  excited: 'linear-gradient(135deg, #FF9A9E, #FECFEF)',
  stressed: 'linear-gradient(135deg, #FF758C, #FF7EB3)',
  neutral: 'linear-gradient(135deg, #E0EAFC, #CFDEF3)'
};

const InfiniteMenu: React.FC<InfiniteMenuProps> = ({ items, onItemClick, onActiveItemChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; time: number } | null>(null);

  // Handle keyboard arrows (Left / Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = { x: e.clientX, time: Date.now() };
    setIsDragging(false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const deltaX = e.clientX - dragStart.current.x;
    dragStart.current = null;
    
    // Check if it's a valid swipe (minimum 40px)
    if (Math.abs(deltaX) > 40) {
      setIsDragging(true);
      if (deltaX < 0) {
        // Swiped Left -> Next item
        setCurrentIndex((prev) => (prev + 1) % items.length);
      } else {
        // Swiped Right -> Previous item
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    }
  };

  const activeItemRef = useRef<string>('');

  useEffect(() => {
    const activeItem = items[currentIndex];
    if (activeItem && onActiveItemChange && activeItem.id !== activeItemRef.current) {
      activeItemRef.current = activeItem.id;
      onActiveItemChange(activeItem);
    }
  }, [currentIndex, items, onActiveItemChange]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full opacity-50">
        <p className="text-[var(--c-subtext)] font-sans uppercase tracking-widest text-xs">
          Vault is empty
        </p>
      </div>
    );
  }

  return (
    <div 
      className="infinite-menu-wrapper" 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none', cursor: 'grab' }}
    >
      <div className="infinite-menu-scene">
        <div 
          className="infinite-menu-carousel"
          style={{ transform: `rotateY(${currentIndex * -(360 / items.length)}deg)` }}
        >
          {items.map((item, index) => {
            const angle = index * (360 / items.length);
            const isActive = index === currentIndex;
            const gradient = item.gradient || emotionGradients[item.emotion.toLowerCase()] || emotionGradients.neutral;

            return (
              <div 
                key={item.id} 
                className={`infinite-menu-item ${isActive ? 'active' : ''}`}
                style={{ 
                  transform: `rotateY(${angle}deg) translateZ(300px)`
                }}
                onClick={() => {
                  if (!isDragging) {
                    onItemClick?.(item);
                  }
                }}
              >
                <motion.div 
                   layoutId={`vault-circle-${item.id}`}
                  className="infinite-menu-texture absolute inset-0 rounded-full" 
                  style={{ 
                    background: gradient,
                    boxShadow: isActive ? `0 0 40px ${gradient.split(',')[1]?.trim() || 'rgba(255,255,255,0.5)'}, inset 0 0 20px rgba(255,255,255,0.4)` : 'inset 0 0 20px rgba(255,255,255,0.2)'
                  }}
                />
                <div className="infinite-menu-content relative z-10 flex flex-col items-center justify-center h-full w-full text-center p-6 drop-shadow-md text-white select-none">
                  {item.dateObj ? (
                    <>
                      <h3 className="font-serif text-[4.5rem] leading-none mb-0 drop-shadow-xl font-medium tracking-tight select-none">
                        {item.dateObj.getDate().toString().padStart(2, '0')}
                      </h3>
                      <p className="font-sans text-sm font-bold opacity-90 uppercase tracking-[0.25em] mt-1 drop-shadow-md select-none">
                        {item.dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                      </p>
                      <div className="mt-2 px-3 py-1.5 rounded-full text-[0.55rem] font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/20 select-none shadow-sm text-white/95">
                        {item.title}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-serif text-xl mb-1 select-none">{item.title}</h3>
                      <p className="font-sans text-xs opacity-70 uppercase tracking-widest select-none">{item.date}</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Navigation hints */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-10 pointer-events-none opacity-50">
        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--c-text)]">
          Swipe left/right or use arrows to explore
        </p>
      </div>
    </div>
  );
};

export default InfiniteMenu;
