'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  color: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  label, 
  color, 
  onClick, 
  loading = false, 
  disabled = false 
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    className={`p-3 rounded-xl bg-gradient-to-r ${color} border border-white/10 flex flex-col items-center justify-center gap-2 text-sm w-full transition-all ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
    }`}
    onClick={onClick}
    disabled={loading || disabled}
  >
    {loading ? (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-5 h-5 border-2 border-white/50 rounded-full border-t-transparent"
      />
    ) : (
      icon
    )}
    <span className="text-white/90 text-center">{label}</span>
  </motion.button>
);

export default function ButtonGroup({ children, className = "" }: ButtonGroupProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {children}
    </div>
  );
}