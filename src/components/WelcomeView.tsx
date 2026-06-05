import React from 'react';
import { motion } from 'motion/react';
import ColorBends from './ColorBends';

const DakotaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 349.899 349.898" xmlns="http://www.w3.org/2000/svg">
    <path fill="#BF0A30" d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255 c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z" />
    <path fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="4" d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25 C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z" />
    <path fill="#002868" d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25 c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z" />
  </svg>
);

interface WelcomeViewProps {
  onGetStarted: () => void;
  team: 'green' | 'purple' | 'red' | 'blue' | 'none';
  setTeam: (team: 'green' | 'purple' | 'red' | 'blue' | 'none') => void;
  isDarkMode: boolean;
  theme: any;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onGetStarted,
  team,
  setTeam,
  isDarkMode,
  theme
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[200] bg-black text-white overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Immersive full-screen background dynamic animation */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <ColorBends 
          colors={["#e11d48", "#1d4ed8", "#f43f5e", "#3b82f6"]}
          rotation={90}
          speed={0.15}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          noise={0.15}
          parallax={0.5}
          iterations={1}
          intensity={1.15}
          bandWidth={6}
          transparent={false}
          autoRotate={0}
          className="absolute inset-0 w-full h-full opacity-100"
        />
        {/* Soft atmospheric gradient to keep content perfectly readable while keeping colors pristine */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Floating Capsule Header */}
      <div className="w-full max-w-5xl mx-auto px-6 pt-6 relative z-50">
        <header className="w-full bg-[#12101e]/60 backdrop-blur-xl border border-white/10 px-8 py-3.5 flex items-center justify-between rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <DakotaLogo className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight text-white lowercase">dakota</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm font-medium text-zinc-400 select-none">
            <span className="hover:text-white transition-colors cursor-pointer">Features</span>
            <span className="hover:text-white transition-colors cursor-pointer font-light">About</span>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 pt-36 pb-32 relative flex flex-col items-center justify-center min-h-[75vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full flex flex-col items-center text-center"
        >
          {/* Badge: New Just shipped v2.0 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-zinc-900/40 backdrop-blur-sm shadow-md mb-8 select-none"
          >
            <span className="bg-white text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">NEW</span>
            <span className="text-zinc-300 font-medium text-[11px] tracking-wide">Just shipped v2.0</span>
          </motion.div>

          {/* Headline Display Text */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-[64px] font-bold text-white tracking-[-0.03em] leading-[1.1] mb-12 max-w-3xl mx-auto"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3)' }}
          >
            The best bill and dispatch method
          </motion.h1>
          
          {/* Simplified Transparent Action Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <button
              onClick={onGetStarted}
              className="px-9 py-3.5 bg-transparent hover:bg-white/5 active:scale-[0.98] text-white border border-white/15 hover:border-white/30 rounded-xl font-medium text-sm tracking-widest uppercase transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer whitespace-nowrap"
            >
              Start Dakota
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Area */}
      <footer className="bg-black/40 border-t border-white/5 py-6 mt-auto relative z-15">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-[11px]">
          <div className="flex items-center gap-2">
            <DakotaLogo className="w-4 h-4 opacity-50" />
            <span className="font-bold tracking-tight text-zinc-400 lowercase">dakota</span>
          </div>
          <p className="text-zinc-600 font-medium uppercase tracking-widest text-[9px]">Dakota Intelligence Systems © 2026</p>
          <div className="flex gap-4 text-[9px] font-mono uppercase text-zinc-600">
            <span>Region: us-east-1</span>
            <span>Version: 0.41.0b</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
