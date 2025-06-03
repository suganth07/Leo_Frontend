'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnimatedBackground() {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Gradient blobs */}
      <motion.div
        className={`absolute top-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
            : 'bg-gradient-to-r from-pink-300 to-purple-300'
        }`}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className={`absolute top-1/3 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-cyan-600 to-purple-600' 
            : 'bg-gradient-to-r from-blue-300 to-cyan-300'
        }`}
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className={`absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-indigo-600 to-pink-600' 
            : 'bg-gradient-to-r from-orange-300 to-pink-300'
        }`}
        animate={{
          x: [0, -60, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${
            theme === 'dark' ? 'white' : 'black'
          } 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}