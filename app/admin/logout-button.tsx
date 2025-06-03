'use client';

import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      // Clear authentication state
      sessionStorage.removeItem('isAuthenticated');
      localStorage.removeItem('isAuthenticated');
      
      // Navigate to home page
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback navigation
      window.location.href = '/';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Logout</span>
    </motion.button>
  );
}