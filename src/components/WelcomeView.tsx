import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  X, 
  Search, 
  MessageSquare, 
  Zap, 
  Bot, 
  ArrowRight,
  Play,
  FileText,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
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

const NavLink = ({ children, active = false }: { children: React.ReactNode, active?: boolean }) => (
  <button className={`flex items-center gap-1 text-sm font-medium ${active ? 'text-zinc-900' : 'text-zinc-500'} hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-50`}>
    {children}
    <ChevronDown size={14} className="opacity-40" />
  </button>
);

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onGetStarted,
  team,
  setTeam,
  isDarkMode,
  theme
}) => {
  const [showWhatIsThis, setShowWhatIsThis] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[200] bg-zinc-950 text-white overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <DakotaLogo className="w-7 h-7" />
            <span className="text-xl font-geologica font-bold tracking-tight text-white lowercase">dakota</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 ml-4">
            <button 
              onClick={() => { setShowWhatIsThis(true); setShowTutorial(false); }}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              What is this
            </button>
            <button 
              onClick={() => { setShowTutorial(true); setShowWhatIsThis(false); }}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Tutorial
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            Start Billing
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center relative">
        {/* Information Modals / Overlays */}
        <AnimatePresence>
          {showWhatIsThis && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-x-6 top-24 z-40 max-w-2xl mx-auto bg-zinc-900 border border-white/10 p-8 rounded-[32px] shadow-2xl text-left"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">What is this?</h3>
                <button onClick={() => setShowWhatIsThis(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Dakota is a regex parsing formatter used to bill and dispatch faster the Traffix ratecons, 
                making the workflow for the tracer quicker, saving you time for other tasks.
              </p>
            </motion.div>
          )}

          {showTutorial && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-x-6 top-24 z-40 max-w-2xl mx-auto bg-zinc-900 border border-white/10 p-8 rounded-[32px] shadow-2xl text-left"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">Tutorial</h3>
                <button onClick={() => setShowTutorial(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 text-zinc-400 text-lg">
                <p>Learn how to use the app in 3 simple steps:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Upload your Traffix rate confirmation PDF.</li>
                  <li>Verify the automatically parsed data fields.</li>
                  <li>Generate your finalized chain or email template instantly.</li>
                </ul>
                <p className="mt-6 text-sm italic">Tactical efficiency for modern logistics.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-bold text-white tracking-[-0.03em] mb-8"
          >
            Bill and dispatch faster.
          </motion.h1>
          
          <div className="flex flex-col items-center gap-12">
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
              Experience the next generation of logistics automation. Designed for performance, built for your team.
            </p>
            
            <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
              {[
                { id: 'none', label: 'None', color: 'bg-zinc-800' },
                { id: 'green', label: '🟢', color: 'bg-emerald-500' },
                { id: 'purple', label: '🟣', color: 'bg-purple-500' },
                { id: 'red', label: '🔴', color: 'bg-red-500' },
                { id: 'blue', label: '🔵', color: 'bg-blue-500' },
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTeam(t.id as any)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-zinc-900 border ${team === t.id ? 'border-white ring-2 ring-white/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  title={t.label}
                >
                   {t.id === 'none' ? <X size={14} className="text-zinc-500" /> : <span className="text-lg">{t.label}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Map Display (Replaced Cards) */}
        <div className="relative h-[600px] w-full rounded-[48px] border border-white/5 bg-zinc-900/50 overflow-hidden group">
          <DottedMapBackground className="opacity-20 !scale-125" color="#ffffff" glow={false} />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-6 max-w-xl"
            >
              <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-600/20">
                <Zap size={32} />
              </div>
              <h4 className="text-3xl font-bold text-white mb-4">Tactical Data Environment</h4>
              <p className="text-zinc-500 text-lg leading-relaxed">
                Your Traffix rate confirmations are processed through a specialized regex parsing engine, 
                eliminating manual entry and streamlining the billing workflow for the tracer.
              </p>
            </motion.div>
          </div>
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-8 left-8 text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">System.Active.0410</div>
          <div className="absolute bottom-8 right-8 text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
            Status: Nominal <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
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
              The world's first tactical logistics billing agent. Built for scale, designed for speed.
            </p>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold text-xs uppercase tracking-widest text-zinc-600">Infrastructure</h6>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="hover:text-white cursor-pointer transition-colors">Regex Engine</li>
              <li className="hover:text-white cursor-pointer transition-colors">Parsing Layer</li>
              <li className="hover:text-white cursor-pointer transition-colors">Tracer Sync</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold text-xs uppercase tracking-widest text-zinc-600">Organization</h6>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="hover:text-white cursor-pointer transition-colors">Intelligence</li>
              <li className="hover:text-white cursor-pointer transition-colors">Operations</li>
              <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold text-xs uppercase tracking-widest text-zinc-600">Tactical Teams</h6>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="flex items-center gap-2 hover:text-emerald-500 cursor-pointer">🟢 Green Team</li>
              <li className="flex items-center gap-2 hover:text-purple-500 cursor-pointer">🟣 Purple Team</li>
              <li className="flex items-center gap-2 hover:text-red-500 cursor-pointer">🔴 Red Team</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex justify-between items-center text-zinc-600">
          <p className="text-xs font-medium uppercase tracking-widest">Dakota Intelligence Systems © 2026</p>
          <div className="flex gap-4 text-[10px] font-mono uppercase">
            <span>Region: us-east-1</span>
            <span>Version: 0.41.0b</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

