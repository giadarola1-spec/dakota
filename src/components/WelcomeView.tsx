import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, X } from 'lucide-react';

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
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] flex bg-background overflow-hidden"
    >
      {/* 20% Left Sidebar: Interactive Content */}
      <div className="w-full lg:w-[20%] h-full bg-background flex flex-col p-8 md:p-12 relative z-10 shadow-[20px_0_50px_rgba(0,0,0,0.05)]">
        {/* Header with Logo */}
        <div className="flex items-center gap-4 mb-20">
          <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100/50">
            <DakotaLogo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-geologica font-bold tracking-tight text-zinc-900 lowercase">dakota</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>STABLE 0410</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl font-display font-medium text-zinc-900 mb-6 leading-tight">
              Billing made faster. <br />
              <span className="text-zinc-500">200% faster.</span>
            </h2>
            <p className="text-base text-zinc-500 font-light mb-12 leading-relaxed">
              Automate your rate confirmation processing with tactical precision.
            </p>
          </motion.div>

          {/* Team Selector */}
          <div className="space-y-4 mb-12">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Tactical Unit</p>
            <div className="flex items-center gap-3">
              {[
                { id: 'none', label: 'None', color: 'bg-zinc-200' },
                { id: 'green', label: '🟢', color: 'bg-emerald-500' },
                { id: 'purple', label: '🟣', color: 'bg-purple-500' },
                { id: 'red', label: '🔴', color: 'bg-red-500' },
                { id: 'blue', label: '🔵', color: 'bg-blue-500' },
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTeam(t.id as any)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${team === t.id ? 'border-zinc-900 scale-110 shadow-lg shadow-zinc-900/10' : 'border-zinc-100 opacity-60 hover:opacity-100 hover:border-zinc-200'}`}
                  title={t.label}
                >
                   {t.id === 'none' ? 
                     <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center"><X size={12} className="text-zinc-400" /></div> : 
                     <span className="text-xl leading-none">{t.id === 'none' ? '' : t.label}</span>
                   }
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 transition-all flex items-center justify-center gap-2 group"
          >
            Get Started
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-zinc-100 flex flex-col gap-1">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
            Dakota Intelligence Systems © 2026
          </p>
          <p className="text-[10px] font-bold text-zinc-500/60 uppercase tracking-widest flex items-center gap-1.5">
            Made in green team <span className="text-emerald-500">💚</span>
          </p>
        </div>
      </div>

      {/* 80% Right: Decorative Background Inspired by MongoDB UI */}
      <div className="hidden lg:flex flex-1 lg:w-[80%] relative bg-[#0a0a0a] overflow-hidden">
        {/* Large Decorative SVG Background (Masked Shapes) */}
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full opacity-30" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#1a1a1a', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#2a2a2a', stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
            <path d="M 0,0 L 1000,0 L 1000,1000 L 0,1000 Z" fill="url(#grad1)" />
          </svg>
        </div>

        {/* Abstract Floating Symbols (Bracket, Asterisk) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative w-full h-full max-w-4xl"
          >
            {/* Large Brackets Symbols */}
            <div className="absolute top-20 right-20 text-[20rem] font-mono font-bold text-white/30 leading-none select-none">
              {"{ }"}
            </div>

            {/* Asterisk Symbol */}
            <div className="absolute bottom-10 right-40 text-[15rem] font-bold text-white/30 leading-none select-none rotate-12">
              *
            </div>

            {/* Slashes */}
            <div className="absolute top-40 left-20 text-[10rem] font-mono font-light text-white/30 leading-none select-none -rotate-12">
              / /
            </div>

            {/* Geometric Orbs */}
            <motion.div 
              animate={{ 
                y: [0, -30, 0],
                rotate: [0, 5, 0] 
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/4 w-96 h-96 bg-zinc-500/10 rounded-full blur-[100px]" 
            />
            <motion.div 
              animate={{ 
                x: [0, 20, 0],
                y: [0, 20, 0] 
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-zinc-300/5 rounded-full blur-[80px]" 
            />
          </motion.div>
        </div>

        
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} 
        />
      </div>
    </motion.div>
  );
};
