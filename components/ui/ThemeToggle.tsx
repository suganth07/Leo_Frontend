'use client';

import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-3 rounded-xl bg-card/50 backdrop-blur-md border border-border/50 hover:bg-card/80 transition-all duration-300 group overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="relative z-10"
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {theme === 'dark' ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
      </motion.div>
      
      {/* Background animation */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-slate-900 to-blue-900' 
            : 'bg-gradient-to-r from-amber-200 to-orange-300'
        }`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)'
        }}
      />
    </motion.button>
  );
}