import React, { useMemo, useState, useEffect, useRef } from 'react';
import DottedMap from 'dotted-map';

interface DottedMapBackgroundProps {
  className?: string;
  color?: string;
  glow?: boolean;
}

export function DottedMapBackground({ className, color = "currentColor", glow = true }: DottedMapBackgroundProps) {
  const svgMap = useMemo(() => {
    try {
      const map = new DottedMap({ height: 60, grid: "diagonal" });

      const svg = map.getSVG({
        radius: 0.22,
        color: color,
        shape: "circle",
        backgroundColor: "transparent",
      });

      return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    } catch (e) {
      console.error("Failed to generate dotted map:", e);
      return `radial-gradient(${color} 1px, transparent 1px)`;
    }
  }, [color]);

  return (
    <div 
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Base Map */}
      <div 
        className={`absolute inset-0 ${glow ? 'opacity-10' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          backgroundImage: svgMap,
          backgroundRepeat: svgMap.startsWith('url') ? 'no-repeat' : 'repeat',
          backgroundPosition: 'center',
          backgroundSize: svgMap.startsWith('url') ? 'contain' : '20px 20px',
          maskImage: glow ? 'radial-gradient(circle at center, black 40%, transparent 100%)' : 'none',
          WebkitMaskImage: glow ? 'radial-gradient(circle at center, black 40%, transparent 100%)' : 'none'
        }}
      />

      {/* Illuminated Layer (Follows Mouse) */}
      {glow && (
        <div 
          className="absolute inset-0 opacity-80 transition-opacity duration-300"
          style={{
            backgroundImage: svgMap,
            backgroundRepeat: svgMap.startsWith('url') ? 'no-repeat' : 'repeat',
            backgroundPosition: 'center',
            backgroundSize: svgMap.startsWith('url') ? 'contain' : '20px 20px',
            maskImage: `radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), black 0%, transparent 80%)`,
            WebkitMaskImage: `radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), black 0%, transparent 80%)`
          }}
        />
      )}
    </div>
  );
}
