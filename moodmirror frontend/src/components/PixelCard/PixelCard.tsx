import React, { useMemo } from 'react';
import './PixelCard.css';

interface PixelCardProps {
  variant?: 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'default';
  children?: React.ReactNode;
  gap?: number;
  speed?: number;
  colors?: string;
  className?: string;
  style?: React.CSSProperties;
}

const getColors = (variant: string) => {
  switch (variant) {
    case 'pink': return ['#FF758C', '#FF7EB3', '#FECFEF', '#ffffff'];
    case 'blue': return ['#A8E6CF', '#6DD5FA', '#2980B9', '#ffffff'];
    case 'yellow': return ['#FFD89B', '#F39C12', '#E67E22', '#ffffff'];
    case 'green': return ['#A8E6CF', '#2ECC71', '#27AE60', '#ffffff'];
    case 'purple': return ['#E2B0FF', '#9F44D3', '#8E44AD', '#ffffff'];
    default: return ['#FFFFFF', '#E0EAFC', '#CFDEF3', '#ffffff'];
  }
};

const PixelCard: React.FC<PixelCardProps> = ({ 
  variant = 'default', 
  children, 
  gap = 4, 
  speed = 1.5, 
  colors,
  className = '',
  style
}) => {
  const colorPalette = colors ? colors.split(',') : getColors(variant);

  // Generate an array of pixels (approximate for average card sizes)
  // We use 60 pixels to ensure full coverage without destroying performance
  const pixels = useMemo(() => Array.from({ length: 90 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: speed + Math.random() * 2,
    color: colorPalette[Math.floor(Math.random() * colorPalette.length)]
  })), [speed, colorPalette]);

  return (
    <div className={`pixel-card-wrapper ${className}`} style={style}>
      <div className="pixel-card-grid" style={{ gap: `${gap}px` }}>
        {pixels.map(p => (
          <div 
            key={p.id} 
            className="pixel-card-pixel"
            style={{ 
              animationDelay: `${p.delay}s`, 
              animationDuration: `${p.duration}s`,
              backgroundColor: p.color
            }}
          />
        ))}
      </div>
      <div className="pixel-card-content">
        {children}
      </div>
    </div>
  );
};

export default PixelCard;
