import { useState } from 'react';
import ThreeSalesOrb from './ThreeSalesOrb';
import { 
  HiOutlineSparkles, 
  HiOutlineCpuChip, 
  HiOutlineBolt, 
  HiOutlineArrowsPointingOut,
  HiOutlineSwatch,
  HiOutlineCube,
  HiOutlineGlobeAlt
} from 'react-icons/hi2';

export default function ThreeSalesBanner({ totalOrders = 0, totalRevenue = 0 }) {
  const [palette, setPalette] = useState('aurora'); // 'aurora', 'solar', 'nebula'
  const [mode, setMode] = useState('globe'); // 'globe', 'quantum', 'matrix', 'vortex'
  const [shockwaveCount, setShockwaveCount] = useState(0);

  const palettes = [
    { id: 'aurora', name: 'Aurora Chromatic', color: 'from-cyan-400 via-violet-500 to-pink-500' },
    { id: 'solar', name: 'Solar Flare', color: 'from-amber-400 via-orange-500 to-rose-500' },
    { id: 'nebula', name: 'Neon Nebula', color: 'from-purple-400 via-indigo-500 to-fuchsia-500' },
  ];

  const modes = [
    { id: 'globe', label: 'Holo Globe & Arcs', icon: HiOutlineGlobeAlt },
    { id: 'quantum', label: 'Quantum Plasma', icon: HiOutlineBolt },
    { id: 'matrix', label: 'Neural Lattice', icon: HiOutlineCube },
    { id: 'vortex', label: 'Gravity Vortex', icon: HiOutlineSparkles },
  ];

  const handleTriggerShockwave = () => {
    setShockwaveCount((prev) => prev + 1);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-950/90 border border-zinc-800/80 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-500 hover:border-zinc-700/80 group">
      {/* Dynamic Colorful Ambient Lighting behind the Card */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-gradient-to-br from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-gradient-to-tl from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Sleek Gradient Border Accent Top */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 via-violet-500 via-pink-500 to-transparent opacity-70" />

      <div className="relative z-10 p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Side: Executive Intelligence Controls & Telemetry */}
        <div className="flex-1 space-y-5 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-400 bg-clip-text text-transparent">
              Industry-Grade 3D Neural Engine
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Spatial Intelligence Core
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
                v2.4
              </span>
            </h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Interactive WebGL spatial mesh rendering live multi-variate transactions, cluster gravity, and reinforcement learning policies in chromatic real-time 3D.
            </p>
          </div>

          {/* Real-time Telemetry Indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <HiOutlineCpuChip className="text-cyan-400 text-sm" />
                <span>Render Pipeline</span>
              </div>
              <p className="text-sm font-bold text-zinc-100">WebGL 2.0 / 60 FPS</p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <HiOutlineBolt className="text-pink-400 text-sm" />
                <span>Node Latency</span>
              </div>
              <p className="text-sm font-bold text-emerald-400">8.4ms Real-time</p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <HiOutlineSparkles className="text-violet-400 text-sm" />
                <span>Physics Drag</span>
              </div>
              <p className="text-sm font-bold text-violet-300">Active (Inertia)</p>
            </div>
          </div>

          {/* Customization Bar: Color Palette & Visual Mode */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            {/* Color Themes */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1">
                <HiOutlineSwatch className="text-zinc-400" /> Color Theme:
              </span>
              {palettes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    palette === p.id 
                      ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm' 
                      : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${p.color}`} />
                  {p.name}
                </button>
              ))}
            </div>

            {/* 3D Geometry Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1">
                <HiOutlineCube className="text-zinc-400" /> 3D Preset:
              </span>
              {modes.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      mode === m.id 
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm' 
                        : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="text-xs" />
                    {m.label}
                  </button>
                );
              })}

              {/* Energy Shockwave Button */}
              <button
                onClick={handleTriggerShockwave}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-pink-600/30 to-violet-600/30 hover:from-pink-600/50 hover:to-violet-600/50 text-pink-200 border border-pink-500/40 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
              >
                <HiOutlineBolt className="text-xs animate-bounce" />
                ⚡ Pulse Shockwave
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Industry-Level 3D WebGL Canvas Viewport */}
        <div className="w-full lg:w-[460px] h-72 sm:h-80 lg:h-96 relative flex items-center justify-center">
          {/* Subtle multi-colored radial glow behind 3D sphere */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/10 via-violet-500/15 to-pink-500/15 blur-2xl" />
          </div>

          <ThreeSalesOrb
            palette={palette}
            mode={mode}
            interactive={true}
            showRings={true}
            triggerShockwave={shockwaveCount}
            height="100%"
            width="100%"
          />

          {/* Drag & Rotate Hint Floating Pill */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 pointer-events-none backdrop-blur-md shadow-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Click & Drag to rotate in 3D • Click to emit pulse</span>
          </div>
        </div>
      </div>
    </div>
  );
}
