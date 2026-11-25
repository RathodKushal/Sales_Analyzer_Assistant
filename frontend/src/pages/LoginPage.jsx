import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineCommandLine,
  HiOutlineSparkles,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineCube,
  HiOutlineArchiveBox,
  HiOutlineDocumentCheck,
  HiOutlineUsers,
  HiOutlineBuildingStorefront,
} from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeSalesOrb from '../components/ThreeSalesOrb';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [warpTargetTitle, setWarpTargetTitle] = useState('CRM Analytics Workspace');
  const [shockwaveCount, setShockwaveCount] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  const rolePresets = [
    {
      label: 'Admin',
      uname: 'admin',
      pwd: 'admin123',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
      icon: <HiOutlineShieldCheck size={14} />,
      desc: 'System Admin Portal',
    },
    {
      label: 'Users',
      uname: 'users',
      pwd: 'users123',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300',
      icon: <HiOutlineUsers size={14} />,
      desc: 'Sales & Customer 360',
    },
    {
      label: 'Manufacturers',
      uname: 'manufacturers',
      pwd: 'manufacturers123',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
      icon: <HiOutlineBuildingStorefront size={14} />,
      desc: 'VMI & Catalog Control',
    },
    {
      label: 'Inventory',
      uname: 'inventory',
      pwd: 'inventory123',
      color: 'from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-300',
      icon: <HiOutlineCube size={14} />,
      desc: 'Inventory Catalog & Stock Control',
    },
    {
      label: 'Purchase Orders',
      uname: 'purchase_order_items',
      pwd: 'purchase123',
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-300',
      icon: <HiOutlineDocumentCheck size={14} />,
      desc: 'POs & Supplier Audits',
    },
    {
      label: 'Quality QA',
      uname: 'quality_inspections',
      pwd: 'quality123',
      color: 'from-rose-500/20 to-pink-500/20 border-rose-500/40 text-rose-300',
      icon: <HiOutlineShieldCheck size={14} />,
      desc: 'Batch QA & Returns',
    },
  ];

  const handleSelectPreset = (preset) => {
    setUsername(preset.uname);
    setPassword(preset.pwd);
    setError('');
  };

  const getTargetDashboard = (user) => {
    const role = (user?.role || '').toLowerCase();
    const uname = (user?.username || '').toLowerCase();

    if (role === 'admin' || uname === 'admin') {
      return { path: '/admin', title: 'Admin Master Control Center' };
    }
    if (role === 'manufacturers' || role === 'manufacturer' || uname === 'manufacturers') {
      return { path: '/dashboard/manufacturers', title: 'Manufacturer & VMI Portal' };
    }
    if (role === 'inventory' || role === 'inventory_manager' || uname === 'inventory') {
      return { path: '/dashboard/inventory', title: 'Warehouse & Inventory Hub' };
    }
    if (role === 'purchase_order_items' || role === 'purchase_manager' || uname === 'purchase_order_items') {
      return { path: '/dashboard/purchase-orders', title: 'Procurement & Purchase Orders' };
    }
    if (role === 'quality_inspections' || role === 'qa_inspector' || uname === 'quality_inspections') {
      return { path: '/dashboard/quality-inspections', title: 'Quality Assurance & Inspections' };
    }
    return { path: '/dashboard', title: 'CRM Analytics Workspace' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(username, password);
      const dest = getTargetDashboard(loggedUser);
      setWarpTargetTitle(dest.title);

      // Trigger cinematic 3D warp transition
      setIsWarping(true);
      setShockwaveCount((prev) => prev + 1);

      setTimeout(() => {
        navigate(dest.path, { state: { justLoggedIn: true } });
      }, 850);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-300 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* 1. Full-Page 3D Three.js Interactive Universe */}
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
                Warping to {warpTargetTitle}...
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
        className="relative z-10 mb-6 flex flex-col items-center text-center max-w-xl pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/60 shadow-xl backdrop-blur-xl mb-3">
          <HiOutlineSparkles className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-400 bg-clip-text text-transparent">
            ShopFlow CRM • Multi-Actor Unified Intelligence
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-2xl">
          Role-Based Portal <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
            Authentication Suite
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg drop-shadow">
          Autonomous Reinforcement Learning CRM featuring dedicated dashboards for Admin, Users, Manufacturers, Inventory, Purchase Orders, and Quality Control.
        </p>
      </motion.div>

      {/* 4. Centerpiece: Frosted Glassmorphism Login Card */}
      <motion.div
        className="relative z-10 w-full max-w-lg"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950/75 backdrop-blur-2xl border border-zinc-700/70 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
          {/* Subtle Chromatic Top Edge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Portal Access
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Authenticate to launch your specialized role dashboard
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-zinc-700/60 flex items-center justify-center shadow-inner">
                <HiOutlineCommandLine size={20} className="text-cyan-400" />
              </div>
            </div>

            {/* Role Quick Selector */}
            <div className="mb-5 p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Quick Role Login Selectors</span>
                <span className="text-[10px] text-cyan-400 font-normal">Click to auto-fill</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {rolePresets.map((preset) => {
                  const isSelected = username === preset.uname;
                  return (
                    <button
                      key={preset.uname}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 border-cyan-400 text-white shadow-md'
                          : 'bg-zinc-900/80 hover:bg-white/5 border-white/5 hover:border-white/20 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                        <span className={`p-1 rounded-md bg-gradient-to-tr ${preset.color}`}>
                          {preset.icon}
                        </span>
                        <span className="truncate">{preset.label}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {preset.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1"
                  htmlFor="username"
                >
                  Operator Username
                </label>
                <input
                  id="username"
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                  type="text"
                  placeholder="e.g. admin, manufacturers, inventory..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1"
                  htmlFor="password"
                >
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
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:via-indigo-500 hover:to-pink-400 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Authenticate & Launch Dashboard'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </motion.div>

      {/* 5. Bottom Interactive Telemetry Bar */}
      <motion.div
        className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 pointer-events-none"
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
          <span>Unified Database Schemas Verified</span>
        </div>
      </motion.div>
    </div>
  );
}
