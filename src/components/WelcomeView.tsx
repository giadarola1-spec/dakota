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
    <div className="fixed inset-0 z-[200] flex bg-[#020617] overflow-hidden">
      {/* 60% Left Content: Corporate Visuals */}
      <div className="hidden lg:flex w-3/5 relative items-center justify-center bg-[#020617]">
        {/* Abstract Corporate Shapes */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative w-[600px] h-[600px]"
        >
          {/* Square */}
          <motion.div 
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              y: [0, -20, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-white/10 rounded-3xl"
          />
          
          {/* Circle */}
          <motion.div 
            animate={{ 
              x: [0, 30, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 border border-[#002868] rounded-full blur-[2px]"
          />
          
          {/* Accent Shapes (Red/White/Blue) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-8">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="w-4 h-32 bg-[#BF0A30] rounded-full blur-sm" 
            />
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              className="w-4 h-48 bg-white/40 rounded-full blur-md" 
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="w-4 h-32 bg-[#002868] rounded-full blur-sm" 
            />
          </div>

          {/* Floating UI Element (Simulating PDF/Data) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-1/3 left-1/4 p-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="w-32 h-2 bg-white/10 rounded mb-3" />
            <div className="w-24 h-2 bg-white/5 rounded mb-3" />
            <div className="w-28 h-2 bg-white/10 rounded" />
          </motion.div>
        </motion.div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-20" 
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
      </div>

      {/* 40% Right Sidebar: Content */}
      <div className="w-full lg:w-2/5 h-full bg-[#020617] border-l border-white/5 flex flex-col p-8 md:p-16 relative z-10 shadow-[-40px_0_100px_rgba(0,0,0,0.8)]">
        {/* Header with Logo */}
        <div className="flex items-center gap-4 mb-20">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <DakotaLogo className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-geologica font-bold tracking-tight text-white lowercase">dakota</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>STABLE 0410</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-5xl font-display font-medium text-white mb-6 leading-tight">
              Billing made faster. <br />
              <span className="text-indigo-400">200% faster.</span>
            </h2>
            <p className="text-lg text-slate-400 font-light mb-12">
              Automate your rate confirmation processing with tactical precision.
            </p>
          </motion.div>

          {/* Team Selector */}
          <div className="space-y-4 mb-12">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Choose your team</p>
            <div className="flex items-center gap-3">
              {[
                { id: 'none', label: 'None', color: 'bg-slate-500' },
                { id: 'green', label: '🟢', color: 'bg-emerald-500' },
                { id: 'purple', label: '🟣', color: 'bg-purple-500' },
                { id: 'red', label: '🔴', color: 'bg-red-500' },
                { id: 'blue', label: '🔵', color: 'bg-blue-500' },
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTeam(t.id as any)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${team === t.id ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  title={t.label}
                >
                   {t.id === 'none' ? 
                     <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center"><X size={12} className="text-white" /></div> : 
                     <span className="text-xl leading-none">{t.label}</span>
                   }
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="w-full py-5 bg-white text-[#0F172A] rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            Get Started
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Footer Info */}
        <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            Corporate Edition 2026
          </p>
          <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#BF0A30]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#002868]" />
          </div>
        </div>
      </div>
    </div>
  );
};
