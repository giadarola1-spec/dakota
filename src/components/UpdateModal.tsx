import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Truck, 
  Clock, 
  FileText, 
  ChevronRight,
  Zap
} from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const DakotaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 349.899 349.898" xmlns="http://www.w3.org/2000/svg">
    <path fill="#BF0A30" d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255 c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z" />
    <path fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="4" d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25 C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z" />
    <path fill="#002868" d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25 c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z" />
  </svg>
);

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-lg ${isDarkMode ? 'bg-[#0a0d17] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-[32px] shadow-2xl overflow-hidden`}
          >
            {/* Real Header Style */}
            <div className={`h-16 px-8 flex items-center justify-between border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex items-center gap-3">
                <DakotaLogo className="w-7 h-7" />
                <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'} lowercase`}>dakota</h1>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'text-zinc-500 hover:bg-white/10 hover:text-white' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Promotion Banner */}
              <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1 text-blue-200">
                      <Sparkles size={14} className="animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">New Update</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight leading-tight">Dakota has been updated</h2>
                    <p className="text-blue-100/70 text-xs mt-1">Check out the following improvements.</p>
                 </div>
                 
                 {/* Abstract background shapes */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                 <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-400/20 rounded-full blur-2xl -ml-8 -mb-8" />
              </div>

              <div className="space-y-5">
                {/* Feature 1 */}
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-none border border-blue-100 dark:border-blue-800/50 group-hover:scale-110 transition-transform">
                    <Truck size={20} className="text-blue-500" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'} text-sm`}>CH Robinson (Beta)</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed mt-0.5`}>
                      Experimental support for C.H. Robinson Rate Confirmations.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-none border border-emerald-100 dark:border-emerald-800/50 group-hover:scale-110 transition-transform">
                    <Clock size={20} className="text-emerald-500" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'} text-sm`}>Time Zone Support</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed mt-0.5`}>
                      Automatic time zone detection for pick-up and delivery appointments.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-none border border-orange-100 dark:border-orange-800/50 group-hover:scale-110 transition-transform">
                    <FileText size={20} className="text-orange-500" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'} text-sm`}>Smart Notes</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed mt-0.5`}>
                      Smart separation of notes for next-day or later deliveries.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl font-bold text-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  Continue
                  <Zap size={16} className="fill-current group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
