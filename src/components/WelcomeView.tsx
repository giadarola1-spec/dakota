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
  const [view, setView] = useState<'home' | 'about' | 'demo'>('home');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[200] bg-[#0a0d17] text-white overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#0a0d17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { if (view === 'home') window.location.reload(); else setView('home'); }}>
            <DakotaLogo className="w-7 h-7" />
            <span className="text-xl font-geologica font-bold tracking-tight text-white lowercase">dakota</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 ml-4">
            <button 
              onClick={() => setView('about')}
              className={`text-sm font-medium transition-colors ${view === 'about' ? 'text-white underline underline-offset-8' : 'text-zinc-400 hover:text-white'}`}
            >
              What is this
            </button>
            <button 
              onClick={() => setView('demo')}
              className={`text-sm font-medium transition-colors ${view === 'demo' ? 'text-white underline underline-offset-8' : 'text-zinc-400 hover:text-white'}`}
            >
              Demo
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-24">
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
                    Precision Logistics Automation. <span className="text-white font-medium">Engineered for speed.</span>
                  </p>
                </div>
              </div>

              <div className="relative h-[600px] w-full rounded-[48px] border border-white/5 bg-zinc-900/50 overflow-hidden group">
                <DottedMapBackground className="opacity-20 !scale-125" color="#ffffff" glow={false} />
              </div>
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto py-12 text-left space-y-16"
            >
              <div className="space-y-6">
                <button 
                  onClick={() => setView('home')}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
                >
                  <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-bold uppercase tracking-widest leading-none">Back to Home</span>
                </button>
                <h2 className="text-5xl font-bold text-white tracking-tight">The Dakota Regex Engine</h2>
                <p className="text-2xl text-zinc-400 font-light leading-relaxed">
                  Dakota is a precision-engineered parsing platform built exclusively for Traffix Rate Confirmations. Dakota does not use AI, ensuring 100% accuracy in data extraction through deterministic regex logic.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-4">
                  <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-600/20">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">No AI Hallucinations</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    By avoiding Large Language Models, Dakota eliminates "guessing." The engine follows strict rulesets defined by the Traffix document structure, providing zero-error parsing.
                  </p>
                </div>

                <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-4">
                  <div className="w-12 h-12 bg-emerald-600/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-600/20">
                    <Search size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Tracer-Centric Design</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    We built Dakota to solve the manual entry bottleneck. By automating the extraction of multi-stop coordinates, tracers can focus on other tasks.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'demo' && (
            <motion.div 
              key="demo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto py-12 text-left space-y-20"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                  <button 
                    onClick={() => setView('home')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 group"
                  >
                    <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest leading-none">Back</span>
                  </button>
                  <h2 className="text-6xl font-bold text-white tracking-tighter">Demo & Functionality</h2>
                  <p className="text-xl text-zinc-500 font-medium">A detailed look at the Dakota Tactical Environment.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-10 rounded-[40px] bg-zinc-900 border border-white/5 space-y-6">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Precise Parsing</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    Identifies multi-stop routes, distinguishes between pickup/delivery times, and extracts weight/rates with 100% precision.
                  </p>
                </div>

                <div className="p-10 rounded-[40px] bg-zinc-900 border border-white/5 space-y-6">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white">
                    <FileText size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Alternative Formats</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    Toggle between Standard and Alternative chain/notes formatting to match specific broker requirements instantly.
                  </p>
                </div>

                <div className="p-10 rounded-[40px] bg-zinc-900 border border-white/5 space-y-6">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white">
                    <Bot size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Team & Truck Saving</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    Quickly select team colors and save frequently used truck numbers to local storage for instant reuse.
                  </p>
                </div>

                <div className="p-10 rounded-[40px] bg-zinc-900 border border-white/5 space-y-6">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-white">
                    <Search size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Address Logic</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    Toggle between Full Address or City/Zip modes. Dakota automatically cleans suite info and isolates location data.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <span>Version: 0.41.0b</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

