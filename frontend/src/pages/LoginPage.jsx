import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCommandLine } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
        await login(username, password);
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row font-sans text-zinc-300">
      {/* Hero Side - Left */}
      <div className="flex-1 bg-zinc-950 border-r border-zinc-900/60 relative overflow-hidden flex items-center justify-center p-8 md:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_50%)]" />
        
        <motion.div 
          className="relative z-10 w-full max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-14 h-14 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)] mb-10">
            <HiOutlineCommandLine size={28} className="text-blue-500" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white leading-[1.1] mb-6">
            E-commerce <br />
            <span className="text-blue-500">Intelligence.</span>
          </h1>
          
          <p className="text-lg text-zinc-400 leading-relaxed max-w-[400px]">
            ShopFlow CRM integrates deep reinforcement learning to optimize discounts, track LTV, and manage operations.
          </p>
        </motion.div>
      </div>

      {/* Form Side - Right */}
      <div className="flex-1 bg-zinc-950/50 flex items-center justify-center p-8 md:p-16">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? 'register' : 'login'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-zinc-500 mb-8">
                {isRegister ? 'Sign up to access the analytics platform' : 'Enter your credentials to continue'}
              </p>

              {error && (
                <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="username">Username</label>
                  <input
                    id="username"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    type="text"
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {isRegister && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="email">Email</label>
                    <input
                      id="email"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isRegister ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-zinc-500">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  className="text-blue-500 hover:text-blue-400 ml-2 font-medium bg-transparent border-none cursor-pointer"
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
