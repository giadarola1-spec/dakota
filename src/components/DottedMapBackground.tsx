import React, { useMemo, useState, useEffect, useRef } from 'react';
import DottedMap from 'dotted-map';

interface DottedMapBackgroundProps {
  className?: string;
  color?: string;
}

export function DottedMapBackground({ className, color = "currentColor" }: DottedMapBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Base Map (Dim) */}
      <div 
        className="absolute inset-0 opacity-10 transition-opacity duration-500"
        style={{
          backgroundImage: svgMap,
          backgroundRepeat: svgMap.startsWith('url') ? 'no-repeat' : 'repeat',
          backgroundPosition: 'center',
          backgroundSize: svgMap.startsWith('url') ? 'contain' : '20px 20px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      {/* Illuminated Layer (Follows Mouse) */}
      <div 
        className="absolute inset-0 opacity-80 transition-opacity duration-300"
        style={{
          backgroundImage: svgMap,
          backgroundRepeat: svgMap.startsWith('url') ? 'no-repeat' : 'repeat',
          backgroundPosition: 'center',
          backgroundSize: svgMap.startsWith('url') ? 'contain' : '20px 20px',
          maskImage: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`
        }}
      />
    </div>
  );
}
