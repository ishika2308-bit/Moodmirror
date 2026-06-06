// Type declarations for plain .jsx components that lack TypeScript definitions

declare module './SplashCursor' {
  import { FC } from 'react';
  const SplashCursor: FC;
  export default SplashCursor;
}

declare module './MagicRings' {
  import { FC } from 'react';
  interface MagicRingsProps {
    color?: string;
    colorTwo?: string;
    ringCount?: number;
    speed?: number;
    attenuation?: number;
    lineThickness?: number;
    baseRadius?: number;
    radiusStep?: number;
    scaleRate?: number;
    opacity?: number;
    blur?: number;
    noiseAmount?: number;
    followMouse?: boolean;
    mouseInfluence?: number;
    hoverScale?: number;
    parallax?: number;
  }
  const MagicRings: FC<MagicRingsProps>;
  export default MagicRings;
}
