import React from 'react';
import { motion } from 'motion/react';
import { DottedMapBackground } from './DottedMapBackground';

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
      className="fixed inset-0 z-[200] bg-[#030723] text-white overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#030723]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <DakotaLogo className="w-7 h-7" />
            <span className="text-xl font-geologica font-bold tracking-tight text-white lowercase">dakota</span>
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative">
        {/* Subtle royal blue ambient glow behind content */}
        <div className="absolute inset-0 top-1/4 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none z-0" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="text-center mb-24">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl md:text-[68px] font-extrabold text-white tracking-[-0.035em] leading-[1.08] mb-6 max-w-4xl mx-auto"
            >
              The best bill and dispatch method
            </motion.h1>
            
            <div className="flex flex-col items-center gap-10">
              <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed">
                Tools and workflow for your day, week and month.
              </p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[560px]"
              >
                {/* GitHub-style action bar */}
                <div className="flex flex-col sm:flex-row items-stretch justify-center w-full rounded-lg overflow-hidden shadow-2xl border border-white/5 select-none font-sans text-left">
                  {/* Left-hand placeholder styled container */}
                  <div className="flex-grow bg-zinc-100 text-zinc-500 px-5 py-4 h-[54px] flex items-center justify-start text-[14.5px] rounded-t-lg sm:rounded-t-none sm:rounded-l-lg tracking-wide border-r border-[#2ea44f]/10">
                    Process rate confirmations
                  </div>
                  {/* Green primary start action */}
                  <button
                    onClick={onGetStarted}
                    className="bg-[#2ea44f] hover:bg-[#2c974b] text-white px-8 py-4 h-[54px] font-bold text-[14.5px] transition-colors duration-200 cursor-pointer text-center flex items-center justify-center whitespace-nowrap rounded-b-lg sm:rounded-b-none sm:rounded-r-lg shadow-sm font-sans"
                  >
                    Start Dakota
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="relative h-[600px] w-full rounded-[48px] overflow-hidden group glowing-map-border bg-[#090d16]/75 transition-all duration-300">
            <DottedMapBackground className="opacity-20 !scale-125" color="#ffffff" glow={false} />
          </div>
        </motion.div>
      </main>

      {/* Footer Area */}
      <footer className="bg-zinc-950 border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <DakotaLogo className="w-6 h-6" />
              <span className="text-xl font-geologica font-bold tracking-tight text-white lowercase">dakota</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-8">
              Designed for billing large scale traffix rate confirmations. Built for speed.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex justify-between items-center text-zinc-600">
          <p className="text-xs font-medium uppercase tracking-widest">Dakota Intelligence Systems © 2026</p>
          <div className="flex gap-4 text-[10px] font-mono uppercase">
            <span>Region: us-east-1</span>
            <span>Version: 0724</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
