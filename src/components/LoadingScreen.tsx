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
        isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'
      }`}
    >
      <Ripple 
        mainCircleSize={210} 
        mainCircleOpacity={isDarkMode ? 0.2 : 0.1} 
        numCircles={8} 
        className={isDarkMode ? 'opacity-30' : 'opacity-100'}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-geologica font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-zinc-900'
          }`}>
            Rate Confirmation Tool
          </h1>
        </div>
        
        <p className={`text-[10px] font-medium uppercase tracking-[0.4em] mt-6 ${
          isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          Initializing System
        </p>
      </motion.div>
    </motion.div>
  );
};
