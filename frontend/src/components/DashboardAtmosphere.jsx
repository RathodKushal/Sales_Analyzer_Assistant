import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineSparkles, 
  HiOutlineAdjustmentsHorizontal, 
  HiOutlineEye, 
  HiOutlineEyeSlash,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi2';

export const THEME_PALETTES = {
  aurora: {
    id: 'aurora',
    name: 'Neon Aurora',
    label: 'Aurora Chromatic',
    primary: 'rgba(6, 182, 212, 0.16)', // cyan
    secondary: 'rgba(139, 92, 246, 0.18)', // violet
    accent: 'rgba(236, 72, 153, 0.12)', // pink
    glow: 'rgba(6, 182, 212, 0.35)',
    colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
    badgeClass: 'from-cyan-400 via-violet-400 to-pink-400',
  },
  cyber: {
    id: 'cyber',
    name: 'Quantum Cyber',
    label: 'Cyber Emerald',
    primary: 'rgba(16, 185, 129, 0.15)', // emerald
    secondary: 'rgba(6, 182, 212, 0.16)', // cyan
    accent: 'rgba(59, 130, 246, 0.14)', // blue
    glow: 'rgba(16, 185, 129, 0.35)',
    colors: ['#10b981', '#06b6d4', '#3b82f6', '#34d399', '#6ee7b7'],
    badgeClass: 'from-emerald-400 via-teal-400 to-cyan-400',
  },
  nebula: {
    id: 'nebula',
    name: 'Deep Nebula',
    label: 'Cosmic Violet',
    primary: 'rgba(168, 85, 247, 0.18)', // purple
    secondary: 'rgba(99, 102, 241, 0.16)', // indigo
    accent: 'rgba(244, 63, 94, 0.12)', // rose
    glow: 'rgba(168, 85, 247, 0.35)',
    colors: ['#a855f7', '#6366f1', '#f43f5e', '#38bdf8', '#c084fc'],
    badgeClass: 'from-purple-400 via-indigo-400 to-rose-400',
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    label: 'Sunset Horizon',
    primary: 'rgba(245, 158, 11, 0.16)', // amber
    secondary: 'rgba(249, 115, 22, 0.14)', // orange
    accent: 'rgba(225, 29, 72, 0.12)', // rose
    glow: 'rgba(245, 158, 11, 0.35)',
    colors: ['#f59e0b', '#f97316', '#e11d48', '#8b5cf6', '#fbbf24'],
    badgeClass: 'from-amber-400 via-orange-400 to-rose-400',
  },
};

export default function DashboardAtmosphere({
  theme = 'aurora',
  onThemeChange,
  particlesEnabled = true,
  onToggleParticles,
  intensity = 'vibrant', // 'subtle', 'balanced', 'vibrant'
  onIntensityChange,
}) {
  const [mousePos, setMousePos] = useState({ x: 600, y: 350 });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [stars, setStars] = useState([]);

  // Generate deterministic stars on mount
  useEffect(() => {
    const generated = [];
    for (let i = 0; i < 35; i++) {
      generated.push({
        id: i,
        top: `${Math.floor(Math.random() * 95)}%`,
        left: `${Math.floor(Math.random() * 98)}%`,
        size: Math.random() > 0.7 ? 2.5 : 1.5,
        opacity: 0.2 + Math.random() * 0.6,
        delay: (Math.random() * 5).toFixed(1),
        duration: (3 + Math.random() * 4).toFixed(1),
      });
    }
    setStars(generated);
  }, []);

  // Track mouse cursor for interactive spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const currentTheme = THEME_PALETTES[theme] || THEME_PALETTES.aurora;

  // Multiplier for intensity
  const intensityMultiplier = intensity === 'vibrant' ? 1.3 : intensity === 'subtle' ? 0.65 : 1.0;

  return (
    <>
      {/* ── BACKGROUND LAYER SYSTEM (Fixed & Non-blocking) ── */}
      <div 
        className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" 
        aria-hidden="true"
      >
        {/* 1. Deep Space Cosmic Radial Gradient Base */}
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: 'radial-gradient(130% 120% at 50% 0%, #080b18 0%, #04050d 45%, #020205 100%)',
          }}
        />

        {/* 2. Primary Floating Chromatic Aurora Orb (Top Right) */}
        <div
          className="absolute -top-36 -right-24 w-[650px] h-[650px] rounded-full blur-[140px] animate-aurora-1 transition-all duration-1000"
          style={{
            background: currentTheme.secondary,
            opacity: 0.85 * intensityMultiplier,
          }}
        />

        {/* 3. Secondary Chromatic Aurora Orb (Top Left / Sidebar Region) */}
        <div
          className="absolute -top-20 -left-32 w-[580px] h-[580px] rounded-full blur-[130px] animate-aurora-2 transition-all duration-1000"
          style={{
            background: currentTheme.primary,
            opacity: 0.8 * intensityMultiplier,
          }}
        />

        {/* 4. Center-Bottom Warm / Accent Glow Pool */}
        <div
          className="absolute bottom-[-15%] left-[25%] w-[700px] h-[500px] rounded-full blur-[150px] animate-aurora-3 transition-all duration-1000"
          style={{
            background: currentTheme.accent,
            opacity: 0.7 * intensityMultiplier,
          }}
        />

        {/* 5. Interactive Cursor Luminous Spotlight */}
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, ${currentTheme.primary} 0%, transparent 65%)`,
            opacity: 0.6 * intensityMultiplier,
          }}
        />

        {/* 6. Precision Architectural Cyber Grid Overlay with Radial Vignette */}
        <div className="absolute inset-0 cyber-grid-overlay mask-radial-vignette opacity-50" />
        <div className="absolute inset-0 cyber-lines-overlay mask-radial-vignette opacity-25" />

        {/* 7. Twinkling Celestial Micro-Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              boxShadow: star.size > 2 ? `0 0 6px rgba(255,255,255,0.8), 0 0 12px ${currentTheme.glow}` : 'none',
            }}
          />
        ))}

        {/* 8. Top Horizon Prismatic Laser Beam Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 via-violet-500 via-pink-500 to-transparent animate-laser-pulse opacity-70" />
        <div className="absolute top-0 left-0 right-0 h-[20px] bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

        {/* 9. Soft Outer Cinematic Edge Vignette */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(2,2,5,0.7) 100%)',
          }}
        />
      </div>

      {/* ── FLOATING AMBIENCE CONTROLS (Modern Glass Capsule) ── */}
      <aside aria-label="Dashboard Ambience Settings" className="fixed bottom-5 right-5 z-40">
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="mb-3 p-4 rounded-2xl bg-zinc-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.8)] text-xs text-zinc-200 w-72 space-y-3.5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-white/10">
                    <HiOutlineSparkles size={14} />
                  </span>
                  <div>
                    <h5 className="text-[12px] font-bold text-white tracking-wide">Atmosphere Engine</h5>
                    <p className="text-[10px] text-zinc-400">Personalize dashboard visuals</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition"
                  title="Close panel"
                >
                  ✕
                </button>
              </div>

              {/* Theme Presets */}
              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold mb-2 block">
                  Color Themes
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.values(THEME_PALETTES).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange && onThemeChange(t.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all text-left ${
                        theme === t.id
                          ? 'bg-white/15 border-white/40 text-white shadow-sm ring-1 ring-white/20'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                      }`}
                    >
                      <span 
                        className={`w-3 h-3 rounded-full bg-gradient-to-tr ${t.badgeClass} flex-shrink-0 shadow-sm`} 
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Settings */}
              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5 block">
                  Glow Intensity
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5">
                  {['subtle', 'balanced', 'vibrant'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onIntensityChange && onIntensityChange(lvl)}
                      className={`py-1 rounded-lg text-[10.5px] font-medium capitalize transition ${
                        intensity === lvl
                          ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-white border border-white/20 shadow-inner'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Nodes Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                  {particlesEnabled ? <HiOutlineEye size={13} className="text-emerald-400" /> : <HiOutlineEyeSlash size={13} className="text-zinc-500" />}
                  3D Constellation Nodes
                </span>
                <button
                  onClick={() => onToggleParticles && onToggleParticles(!particlesEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    particlesEnabled ? 'bg-cyan-600' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      particlesEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Pill Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-950/80 hover:bg-zinc-900/90 text-zinc-300 hover:text-white border border-white/15 hover:border-cyan-500/50 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-gradient-to-tr ${currentTheme.badgeClass}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-tr ${currentTheme.badgeClass}`} />
          </span>
          <span className="text-xs font-semibold tracking-wide">
            {currentTheme.name}
          </span>
          <span className="text-zinc-500 group-hover:text-zinc-300 transition">
            {isPanelOpen ? <HiOutlineChevronDown size={14} /> : <HiOutlineAdjustmentsHorizontal size={14} />}
          </span>
        </motion.button>
      </aside>
    </>
  );
}
