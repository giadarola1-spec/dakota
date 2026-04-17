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
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Automate repetitive work",
      description: "Let Dakota handle the data entry from your rate confirmations.",
      icon: <Zap className="w-5 h-5" />,
      tag: "New",
      details: [
        { name: "Emily", text: "How do I process this load?", reply: "Just drag the PDF into Dakota." },
        { name: "Catherine", text: "Is the rate captured correctly?", reply: "100% accuracy on standard fields." },
        { name: "Stephanie", text: "Can we link the ELD?", reply: "Yes, fully integrated." }
      ]
    },
    {
      title: "Q&A agents",
      description: "Ask questions instantly using knowledge you already have.",
      icon: <Search className="w-5 h-5" />,
    },
    {
      title: "Task routing",
      description: "Assign loads and tasks with tactical precision.",
      icon: <Bot className="w-5 h-5" />,
    },
    {
      title: "Reporting",
      description: "Full visibility into your team's tactical performance.",
      icon: <FileText className="w-5 h-5" />,
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[200] bg-white overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <DakotaLogo className="w-7 h-7" />
            <span className="text-xl font-geologica font-bold tracking-tight text-zinc-900 lowercase">dakota</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <NavLink>What is this</NavLink>
            <button onClick={onGetStarted} className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-50">
              Start Billing
              <ChevronDown size={14} className="opacity-40" />
            </button>
            <NavLink>Tutorial</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2">Log in</button>
          <button 
            onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all"
          >
            Start Billing
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-bold text-zinc-900 tracking-[-0.03em] mb-8"
          >
            Bill and dispatch faster.
          </motion.h1>
          
          {/* Team Selector Sub-Hero */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-light leading-relaxed">
              Experience the next generation of logistics automation. Designed for performance, built for your team.
            </p>
            
            <div className="flex items-center gap-3 p-1.5 bg-zinc-100 rounded-full border border-zinc-200 shadow-inner">
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white shadow-sm border ${team === t.id ? 'border-zinc-900 ring-2 ring-zinc-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  title={t.label}
                >
                   {t.id === 'none' ? <X size={14} className="text-zinc-400" /> : <span className="text-lg">{t.label}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Showcase Box (The "Notion" Block) */}
        <div className="bg-[#fff9f4] rounded-[32px] border border-zinc-100 shadow-xl overflow-hidden flex flex-col lg:flex-row relative">
          {/* Left Feature Sidebar */}
          <div className="w-full lg:w-[400px] p-8 bg-white border-r border-zinc-50 space-y-2">
            {features.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFeature(i)}
                className={`w-full text-left p-6 rounded-2xl transition-all group relative ${activeFeature === i ? 'bg-[#f6f6f6]' : 'hover:bg-zinc-50'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${activeFeature === i ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 transition-colors'}`}>
                    {f.icon}
                  </div>
                  {f.tag && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{f.tag}</span>}
                  <span className={`font-bold text-lg ${activeFeature === i ? 'text-zinc-900' : 'text-zinc-500'}`}>{f.title}</span>
                </div>
                {activeFeature === i && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                    <ArrowRight className="w-5 h-5 text-zinc-900" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          {/* Right Showcase area */}
          <div className="flex-1 min-h-[500px] relative p-12 flex items-center justify-center overflow-hidden bg-[#fff9f4]">
            <DottedMapBackground className="opacity-[0.05] !scale-150 rotate-12" color="#000000" glow={false} />
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeFeature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-10 w-full max-w-lg space-y-4"
              >
                {activeFeature === 0 ? (
                  <>
                    {features[0].details?.map((d, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-2xl shadow-lg border border-zinc-100 flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-none">
                          <span className="text-zinc-400 font-bold text-xs">{d.name[0]}</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-bold text-zinc-900">{d.name}</p>
                          <p className="text-sm text-zinc-500">{d.text}</p>
                          <div className="flex items-center gap-1.5 mt-2 bg-blue-50 text-blue-600 w-fit px-2 py-1 rounded-lg">
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-[10px] font-bold">1 reply</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div className="bg-white aspect-video rounded-3xl shadow-2xl border border-zinc-100 flex items-center justify-center group cursor-pointer overflow-hidden relative">
                    <div className="absolute inset-0 bg-zinc-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <Play className="fill-blue-600 text-blue-600 translate-x-0.5" />
                      </div>
                    </div>
                    <div className="p-8 text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        {features[activeFeature].icon}
                      </div>
                      <h4 className="text-xl font-bold text-zinc-900">{features[activeFeature].title}</h4>
                      <p className="text-zinc-500 text-sm">Watch a quick demonstration of how this tactical unit operates.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Benefits Bar */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Tactical Precision", 
              desc: "100% data capturing from complex rate confirmations.", 
              icon: <ShieldCheck className="text-emerald-500" /> 
            },
            { 
              title: "Zero Delay", 
              desc: "Millisecond processing times for large document batches.", 
              icon: <Zap className="text-amber-500" /> 
            },
            { 
              title: "Active Deployment", 
              desc: "Integrated with your existing dispatch workflows.", 
              icon: <ArrowRight className="text-blue-500" /> 
            }
          ].map((benefit, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                {benefit.icon}
              </div>
              <h5 className="font-bold text-lg text-zinc-900">{benefit.title}</h5>
              <p className="text-zinc-500 text-sm leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Full Footer Area */}
      <footer className="bg-zinc-50 border-t border-zinc-100 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <DakotaLogo className="w-6 h-6" />
              <span className="text-xl font-geologica font-bold tracking-tight text-zinc-900 lowercase">dakota</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-8">
              The world's first tactical logistics billing agent. Built for scale, designed for speed.
            </p>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Product</h6>
            <ul className="space-y-2 text-sm text-zinc-500 font-medium">
              <li className="hover:text-zinc-900 cursor-pointer">What is this?</li>
              <li className="hover:text-zinc-900 cursor-pointer">Rate Indexing</li>
              <li className="hover:text-zinc-900 cursor-pointer">Team Sync</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Company</h6>
            <ul className="space-y-2 text-sm text-zinc-500 font-medium">
              <li className="hover:text-zinc-900 cursor-pointer">About</li>
              <li className="hover:text-zinc-900 cursor-pointer">Contact</li>
              <li className="hover:text-zinc-900 cursor-pointer">Privacy</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Tactical</h6>
            <ul className="space-y-2 text-sm text-zinc-500 font-medium">
              <li className="flex items-center gap-2 hover:text-emerald-600 cursor-pointer">
                Green Team 🟢
              </li>
              <li className="flex items-center gap-2 hover:text-purple-600 cursor-pointer">
                Purple Team 🟣
              </li>
              <li className="flex items-center gap-2 hover:text-red-600 cursor-pointer">
                Red Team 🔴
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-200">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-tighter">Dakota Intelligence Systems © 2026</p>
        </div>
      </footer>
    </motion.div>
  );
};

