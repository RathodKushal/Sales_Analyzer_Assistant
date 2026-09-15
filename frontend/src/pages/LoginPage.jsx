import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCommandLine, HiOutlineSparkles, HiOutlineKey, HiOutlineShieldCheck } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeSalesOrb from '../components/ThreeSalesOrb';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [shockwaveCount, setShockwaveCount] = useState(0);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
  };

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
      
      // Trigger cinematic 3D warp transition
      setIsWarping(true);
      setShockwaveCount((prev) => prev + 1);

      setTimeout(() => {
        navigate('/dashboard', { state: { justLoggedIn: true } });
      }, 850);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-300 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* 1. Full-Page 3D Three.js Interactive Universe (Covering 100% of the screen) */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto z-0">
        <ThreeSalesOrb 
          palette="aurora" 
          mode="matrix" 
          interactive={!isWarping} 
          showRings={true} 
          triggerShockwave={shockwaveCount}
          width="100%" 
          height="100%" 
        />
      </div>

      {/* Cinematic Warp Light Streak Overlay */}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-3xl pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.35),rgba(139,92,246,0.25),transparent_70%)]" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center mb-5 shadow-2xl shadow-cyan-500/30">
                <HiOutlineSparkles className="text-3xl text-cyan-400 animate-spin" />
              </div>
              <p className="text-xs font-mono font-semibold tracking-widest text-cyan-400 uppercase mb-2">
                ACCESS GRANTED // OPERATOR AUTHENTICATED
              </p>
              <h3 className="text-2xl font-black text-white tracking-tight mb-4">
                Warping to CRM Dashboard...
              </h3>
              {/* Progress bar */}
              <div className="w-48 h-1.5 rounded-full bg-zinc-800/80 overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.75, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 shadow-[0_0_12px_#06b6d4]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Full-Page Ambient Chromatic Vignette & Glows */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/70 pointer-events-none z-1" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.14),transparent_50%)] pointer-events-none z-1" />

      {/* 3. Top Floating Brand & Intelligence Tag */}
      <motion.div 
        className="relative z-10 mb-6 flex flex-col items-center text-center max-w-lg pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/60 shadow-xl backdrop-blur-xl mb-3">
          <HiOutlineSparkles className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-400 bg-clip-text text-transparent">
            ShopFlow CRM • 3D Spatial Intelligence
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-2xl">
          E-Commerce <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
            Relationship Intelligence
          </span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md drop-shadow">
          Autonomous Reinforcement Learning CRM for dynamic pricing, customer LTV clustering, and inventory predictions.
        </p>
      </motion.div>

      {/* 4. Centerpiece: Frosted Glassmorphism Login Card */}
      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950/75 backdrop-blur-2xl border border-zinc-700/70 p-7 sm:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
          {/* Subtle Chromatic Top Edge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500" />

          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? 'register' : 'login'}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {isRegister ? 'Create CRM Account' : 'Portal Access'}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isRegister ? 'Enter details to provision your CRM workspace' : 'Authenticate to access live analytics & models'}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-zinc-700/60 flex items-center justify-center shadow-inner">
                  <HiOutlineCommandLine size={22} className="text-cyan-400" />
                </div>
              </div>

              {error && (
                <div className="p-3 mb-5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5" htmlFor="username">
                    Operator Username
                  </label>
                  <input
                    id="username"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
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
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5" htmlFor="email">
                      Corporate Email
                    </label>
                    <input
                      id="email"
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                      type="email"
                      placeholder="admin@shopflow.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5" htmlFor="password">
                    Security Passcode
                  </label>
                  <input
                    id="password"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {/* Submit Button with Dynamic Gradient */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:via-indigo-500 hover:to-pink-400 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isRegister ? (
                    'Provision CRM Workspace'
                  ) : (
                    'Enter CRM Workspace'
                  )}
                </button>
              </form>

              {/* Demo Credentials Quick Fill */}
              {!isRegister && (
                <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <HiOutlineKey className="text-zinc-400" /> Default: <code className="text-zinc-300 font-mono">admin / admin123</code>
                  </span>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition cursor-pointer"
                  >
                    Quick Auto-Fill
                  </button>
                </div>
              )}

              {/* Toggle Register/Login */}
              <div className="mt-5 text-center text-xs text-zinc-400">
                {isRegister ? 'Already registered?' : 'Need a new CRM workspace?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  className="text-pink-400 hover:text-pink-300 ml-2 font-bold transition cursor-pointer"
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 5. Bottom Interactive Telemetry Bar */}
      <motion.div 
        className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Click & Drag to rotate 3D Universe</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <HiOutlineShieldCheck className="text-emerald-400 text-sm" />
          <span>Full-Page WebGL Active</span>
        </div>
      </motion.div>
    </div>
  );
}
