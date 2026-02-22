import React, { useMemo } from 'react';
import DottedMap from 'dotted-map';

interface DottedMapBackgroundProps {
  className?: string;
  color?: string;
}

export function DottedMapBackground({ className, color = "currentColor" }: DottedMapBackgroundProps) {
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
      // Fallback pattern
      return `radial-gradient(${color} 1px, transparent 1px)`;
    }
  }, [color]);

  return (
    <div 
      className={`absolute inset-0 z-0 pointer-events-none opacity-20 ${className}`}
      style={{
        backgroundImage: svgMap,
        backgroundRepeat: svgMap.startsWith('url') ? 'no-repeat' : 'repeat',
        backgroundPosition: 'center',
        backgroundSize: svgMap.startsWith('url') ? 'contain' : '20px 20px',
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
      }}
    />
  );
}
