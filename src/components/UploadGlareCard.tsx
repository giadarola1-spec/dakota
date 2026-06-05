import React, { useRef, useState, useEffect } from 'react';

interface UploadGlareCardProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  isDragging?: boolean;
}

export const UploadGlareCard: React.FC<UploadGlareCardProps> = ({ 
  children, 
  className = "", 
  isDragging = false,
  ...props 
}) => {
  const containerRef = useRef<HTMLLabelElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize CSS custom properties immediately on mount so they exist for the transition on the first hover
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--tilt-x', '0deg');
      containerRef.current.style.setProperty('--tilt-y', '0deg');
      containerRef.current.style.setProperty('--glare-x', '50%');
      containerRef.current.style.setProperty('--glare-y', '50%');
      containerRef.current.style.setProperty('--glare-angle', '135deg');
    }
  }, []);

  const calculateAndApplyCoordinates = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate normalized relative position from 0 to 1
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Set precise coordinates inside the card container for glare positioning
    const glareX = e.clientX - rect.left;
    const glareY = e.clientY - rect.top;

    // Map 0 to 1 range to tilt degree (e.g. -5 degrees to +5 degrees)
    const maxTilt = 5; 
    const tiltX = (y - 0.5) * -maxTilt; 
    const tiltY = (x - 0.5) * maxTilt;
    const glareAngle = 135 + (tiltX + tiltY) * 2.5;

    // Set styles synchronously on the Ref element for ultra-smooth responsiveness
    containerRef.current.style.setProperty('--glare-x', `${glareX}px`);
    containerRef.current.style.setProperty('--glare-y', `${glareY}px`);
    containerRef.current.style.setProperty('--tilt-x', `${tiltX}deg`);
    containerRef.current.style.setProperty('--tilt-y', `${tiltY}deg`);
    containerRef.current.style.setProperty('--glare-angle', `${glareAngle}deg`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLLabelElement>) => {
    calculateAndApplyCoordinates(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLLabelElement>) => {
    setIsHovered(true);
    calculateAndApplyCoordinates(e);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (containerRef.current) {
      // Smoothly transition back to centered identity styling values
      containerRef.current.style.setProperty('--tilt-x', '0deg');
      containerRef.current.style.setProperty('--tilt-y', '0deg');
      containerRef.current.style.setProperty('--glare-x', '50%');
      containerRef.current.style.setProperty('--glare-y', '50%');
      containerRef.current.style.setProperty('--glare-angle', '135deg');
    }
  };

  // Build the inline transition and 3D transform strings using hardware-accelerated CSS properties
  const transformStyle = isDragging
    ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.01, 1.01, 1.01)'
    : isHovered
      ? 'perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale3d(1.008, 1.008, 1.008)'
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

  return (
    <label
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden cursor-pointer select-none ${className}`}
      style={{
        transform: transformStyle,
        transformStyle: 'preserve-3d',
        transition: isDragging 
          ? 'transform 0.15s ease-out, border-color 0.2s, background-color 0.2s, opacity 0.3s'
          : isHovered 
            ? 'transform 0.08s ease-out, border-color 0.2s, background-color 0.2s, opacity 0.3s' 
            : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s, background-color 0.2s, opacity 0.3s',
      }}
      {...props}
    >
      {/* Sleek radial glare mirror light layer helper */}
      {isHovered && !isDragging && (
        <div
          className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge opacity-25 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 220px at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255, 255, 255, 0.12), transparent 85%)`,
          }}
        />
      )}
      
      {/* Sleek diagonal glare line following tilt rotation */}
      {isHovered && !isDragging && (
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-15 mix-blend-overlay transition-opacity duration-300"
          style={{
            background: `linear-gradient(var(--glare-angle, 135deg), transparent 35%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 52%, transparent 65%)`,
          }}
        />
      )}

      {/* Primary child content container on separated depth plane to highlight 3D parallax */}
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative z-20 space-y-6"
        style={{
          transform: isHovered && !isDragging ? 'translateZ(6px)' : 'translateZ(0px)',
          transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {children}
      </div>
    </label>
  );
};
