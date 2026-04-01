import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Hash, ChevronRight } from 'lucide-react';

interface DriverNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (driverNumber: string) => void;
  isDarkMode: boolean;
  theme: any;
}

export const DriverNumberModal: React.FC<DriverNumberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDarkMode,
  theme
}) => {
  const [digits, setDigits] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      if (digits.length > 0) setDigits([]);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setDigits(prev => [...prev, e.key]);
      } else if (e.key === 'Backspace') {
        setDigits(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (digits.length > 0) {
          onConfirm(digits.join(''));
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, digits, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`${theme.cardBg} border ${theme.border} w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          {/* Background Glow */}
          {isDarkMode && <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />}
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Hash size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className={`text-3xl font-display font-medium ${theme.text}`}>Driver Number</h2>
              <p className={`${theme.textMuted} text-sm max-w-[280px]`}>
                Please enter the truck or driver number for this load.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 min-h-[80px]">
              <AnimatePresence mode="popLayout">
                {digits.map((digit, idx) => (
                  <motion.div
                    key={`${idx}-${digit}`}
                    layout
                    initial={{ scale: 0, opacity: 0, y: 20, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, y: -20, rotate: 15 }}
                    transition={{ 
                      type: "spring", 
                      damping: 15, 
                      stiffness: 400,
                      mass: 0.6
                    }}
                    className={`w-14 h-20 rounded-2xl border-2 ${theme.border} ${theme.inputBg} flex items-center justify-center text-3xl font-mono font-bold ${theme.text} shadow-xl shadow-indigo-500/10 relative group`}
                  >
                    <motion.div 
                      layoutId="liquid-bg"
                      className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-sm group-hover:bg-indigo-500/10 transition-colors" 
                    />
                    <span className="relative z-10">{digit}</span>
                  </motion.div>
                ))}
                
                {/* Cursor Box */}
                <motion.div
                  key="cursor"
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-14 h-20 rounded-2xl border-2 border-dashed ${theme.border} ${theme.inputBg} flex items-center justify-center opacity-40 relative overflow-hidden`}
                >
                  <motion.div 
                    animate={{ 
                      opacity: [0.2, 0.5, 0.2],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-indigo-500/10 blur-md"
                  />
                  <span className="text-2xl font-mono relative z-10">_</span>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="w-full pt-4 space-y-4">
              <button
                onClick={() => onConfirm(digits.join(''))}
                disabled={digits.length === 0}
                className={`w-full py-4 rounded-2xl ${theme.accentBg} ${theme.accentHover} text-white font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm Number
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className={`text-[10px] uppercase tracking-widest ${theme.textMuted} font-bold opacity-50`}>
                Press Enter to continue
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full hover:${theme.cardBg} transition-colors ${theme.textMuted}`}
          >
            <X size={20} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
