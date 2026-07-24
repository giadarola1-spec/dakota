import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface WelcomeSplashProps {
  onComplete: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onComplete }) => {
  useEffect(() => {
    // Total animation sequence length before transitioning into WelcomeView
    const timer = setTimeout(() => {
      onComplete();
    }, 2600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[999] bg-[#030723] flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Living Morphing Background Glow Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Layer 1: Main morphing liquid blue-cyan blob */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0.5, 0.85, 0.6, 0.8, 0.5],
            scale: [0.85, 1.15, 0.95, 1.1, 0.85],
            rotate: [0, 120, 240, 360],
            borderRadius: [
              '40% 60% 70% 30% / 40% 50% 60% 50%',
              '60% 30% 50% 70% / 50% 70% 30% 60%',
              '30% 70% 40% 60% / 60% 30% 70% 40%',
              '50% 50% 60% 40% / 40% 60% 50% 50%',
              '40% 60% 70% 30% / 40% 50% 60% 50%'
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] bg-gradient-to-tr from-blue-600/40 via-indigo-500/35 to-sky-400/30 blur-[90px] sm:blur-[120px]"
        />

        {/* Layer 2: Counter-rotating secondary morphing blob with red & deep blue accents */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.4, 0.7, 0.35, 0.65, 0.4],
            scale: [1.1, 0.85, 1.15, 0.9, 1.1],
            rotate: [360, 240, 120, 0],
            borderRadius: [
              '60% 40% 30% 70% / 50% 60% 40% 60%',
              '30% 60% 70% 40% / 60% 40% 50% 50%',
              '50% 30% 60% 40% / 40% 70% 30% 60%',
              '60% 40% 30% 70% / 50% 60% 40% 60%'
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute w-[450px] h-[450px] sm:w-[580px] sm:h-[580px] bg-gradient-to-bl from-blue-700/30 via-rose-600/20 to-blue-900/40 blur-[80px] sm:blur-[110px]"
        />

        {/* Layer 3: Core breathing radial aura directly behind logo/text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.6, 0.9, 0.6],
            scale: [0.95, 1.08, 0.95]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.15) 50%, rgba(3, 7, 35, 0) 75%)'
          }}
          className="absolute w-[600px] h-[350px] sm:w-[800px] sm:h-[450px] rounded-full pointer-events-none"
        />
      </div>

      <div className="relative z-20 flex items-center justify-center gap-4 sm:gap-6 px-4">
        {/* Animated Three Dots Dakota Logo - razor sharp crisp SVG vector circles */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0">
          <svg 
            className="w-full h-full overflow-visible" 
            viewBox="-10 -10 370 370" 
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="geometricPrecision"
          >
            {/* Top Red Dot */}
            <motion.circle
              cx="175.522"
              cy="89.485"
              r="77.255"
              fill="#BF0A30"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: '175.522px 89.485px' }}
            />
            {/* Bottom Left White Dot */}
            <motion.circle
              cx="77.255"
              cy="260.412"
              r="77.255"
              fill="#FFFFFF"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: '77.255px 260.412px' }}
            />
            {/* Bottom Right Blue Dot */}
            <motion.circle
              cx="272.648"
              cy="260.401"
              r="77.255"
              fill="#002868"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: '272.648px 260.401px' }}
            />
          </svg>
        </div>

        {/* Dakota Text in actual Geologica font */}
        <motion.span
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl font-geologica font-bold tracking-tight text-white lowercase leading-none"
        >
          dakota
        </motion.span>
      </div>
    </motion.div>
  );
};

