import React from 'react';
import { WallpaperConfig } from '../utils/wallpaperStorage';

interface CustomWallpaperBackgroundProps {
  config: WallpaperConfig;
  isDarkMode: boolean;
  className?: string;
}

export const CustomWallpaperBackground: React.FC<CustomWallpaperBackgroundProps> = ({
  config,
  isDarkMode,
  className = "",
}) => {
  if (!config.enabled || !config.imageData) {
    return null;
  }

  const { imageData, opacity, blur, vignette } = config;
  const blurScale = blur > 0 ? 1 + Math.min(blur, 30) * 0.006 : 1;

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-300 ${className}`}
      aria-hidden="true"
    >
      {/* Background Image with blur and opacity */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-opacity duration-300"
        style={{
          backgroundImage: `url(${imageData})`,
          opacity: Math.max(0, Math.min(100, opacity)) / 100,
          filter: blur > 0 ? `blur(${blur}px)` : 'none',
          transform: `scale(${blurScale})`,
          willChange: 'filter, opacity, transform',
        }}
      />

      {/* Customizable Vignette Overlay (Dark radial focus around edges) */}
      {vignette > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: isDarkMode
              ? `radial-gradient(ellipse at center, rgba(10, 13, 23, 0) 35%, rgba(10, 13, 23, ${(vignette / 100) * 0.75}) 75%, rgba(3, 5, 12, ${vignette / 100}) 100%)`
              : `radial-gradient(ellipse at center, rgba(255, 255, 255, 0) 30%, rgba(0, 0, 0, ${(vignette / 100) * 0.45}) 75%, rgba(0, 0, 0, ${(vignette / 100) * 0.8}) 100%)`,
          }}
        />
      )}

      {/* Subtle depth shade to ensure crisp text readability in both modes */}
      <div 
        className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-[#0a0d17]/25 mix-blend-multiply' 
            : 'bg-white/20 mix-blend-overlay'
        }`} 
      />
    </div>
  );
};
