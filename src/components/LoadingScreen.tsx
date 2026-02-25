import React from 'react';
import { motion } from 'motion/react';
import { Ripple } from '@/components/ui/ripple';

interface LoadingScreenProps {
  isDarkMode?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isDarkMode = true }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${
        isDarkMode ? 'bg-slate-950' : 'bg-white'
      }`}
    >
      <Ripple 
        mainCircleSize={210} 
        mainCircleOpacity={isDarkMode ? 0.3 : 0.15} 
        numCircles={8} 
        className={isDarkMode ? 'opacity-70' : 'opacity-100'}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Header-identical Dakota Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className={`text-4xl font-geologica font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            } lowercase`}>
              dakota
            </h1>
            <div className="flex gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#BF0A30] shadow-sm" />
              <div className={`w-3.5 h-3.5 rounded-full shadow-sm border ${
                isDarkMode ? 'bg-slate-200 border-white/20' : 'bg-white border-slate-200/50'
              }`} />
              <div className="w-3.5 h-3.5 rounded-full bg-[#002868] shadow-sm" />
            </div>
          </div>
        </div>
        
        <p className={`text-[10px] font-medium uppercase tracking-[0.4em] mt-6 ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Initializing System
        </p>
      </motion.div>
    </motion.div>
  );
};
