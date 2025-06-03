'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate, logout } from '@/app/actions';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiArrowRight, FiShield, FiSmartphone, FiEye, FiEyeOff, FiCamera } from 'react-icons/fi';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import ParticleBackground from '@/components/ui/ParticleBackground';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const [role, setRole] = useState<'admin' | 'client'>('client');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      if (role === 'admin') {
        // Simple client-side password check to avoid Server Actions issues
        if (password === 'admin123') {
          // Store authentication state in sessionStorage
          sessionStorage.setItem('isAuthenticated', 'true');
          router.push('/admin');
        } else {
          setError('Invalid admin password');
        }
      } else {
        router.push('/client');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen font-sans relative bg-background transition-colors duration-300 overflow-hidden">
      <AnimatedBackground />
      <ParticleBackground />
      
      {/* Header */}
      <header className="relative z-10 py-6 px-8 flex justify-between items-center border-b border-border/50 studio-glass">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-xl studio-gradient flex items-center justify-center shadow-lg">
            <FiCamera className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold studio-text-gradient">Leo Photography</h1>
            <p className="text-xs text-muted-foreground">Professional Studio</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-sm text-muted-foreground">Secure Portal Access</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="studio-card border shadow-xl">
            {/* Card Header */}
            <div className="bg-muted/30 px-6 py-5 border-b border-border/50 rounded-t-2xl">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-display font-bold studio-text-gradient"
              >
                Professional Portal
              </motion.h2>
              <p className="text-sm text-muted-foreground mt-1">Secure access for clients and staff</p>
            </div>
            
            {/* Card Body */}
            <div className="p-6 space-y-6">
              {/* Role Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Access Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      role === 'client'
                        ? 'studio-gradient text-background border-foreground/30'
                        : 'studio-glass border-border/50 hover:border-foreground/30'
                    }`}
                    onClick={() => setRole('client')}
                  >
                    <FiUser className="w-5 h-5 mb-2" />
                    <div className="font-medium">Client</div>
                    <div className="text-xs opacity-70">View Galleries</div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      role === 'admin'
                        ? 'studio-gradient text-background border-foreground/30'
                        : 'studio-glass border-border/50 hover:border-foreground/30'
                    }`}
                    onClick={() => setRole('admin')}
                  >
                    <FiLock className="w-5 h-5 mb-2" />
                    <div className="font-medium">Admin</div>
                    <div className="text-xs opacity-70">Manage Studio</div>
                  </motion.button>
                </div>
              </div>
              
              {/* Password Field - Only for Admin */}
              {role === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label htmlFor="password" className="block text-sm font-medium">
                    Admin Credentials
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter security passphrase"
                      className="professional-input pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <motion.button 
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
              
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm"
                >
                  <FiLock className="flex-shrink-0 text-destructive" />
                  <span className="text-destructive">{error}</span>
                </motion.div>
              )}

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                disabled={isLoading || (role === 'admin' && !password)}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isLoading || (role === 'admin' && !password)
                    ? 'bg-muted cursor-not-allowed text-muted-foreground'
                    : 'studio-gradient text-background hover:shadow-lg animate-professional-glow'
                }`}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                    />
                    Authenticating...
                  </>
                ) : (
                  <>
                    {role === 'admin' ? 'Secure Login' : 'Enter Client Portal'}
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
            
            {/* Card Footer */}
            <div className="bg-muted/30 px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/50 rounded-b-2xl">
              <p>Professional Photography Security Standards</p>
            </div>
          </div>
          
          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-sm text-muted-foreground space-y-1"
          >
            <p>Professional photography services since 2015</p>
            <p>© {new Date().getFullYear()} Leo Photography. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}