import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

export function MissingDataBadge({ tooltip = "This data not mentioned in the dataset", className = "" }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div
        className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/10 cursor-help transition-transform hover:scale-110"
        title={tooltip}
      >
        !
      </div>

      {show && (
        <div className="absolute right-0 top-8 z-50 min-w-[240px] max-w-xs px-3.5 py-2.5 bg-zinc-950/95 text-zinc-100 text-xs rounded-xl border border-amber-500/40 shadow-2xl backdrop-blur-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-2">
            <HiOutlineExclamationTriangle className="text-amber-400 text-sm flex-shrink-0 mt-0.5" />
            <span className="leading-snug text-zinc-200">{tooltip}</span>
          </div>
          <div className="absolute -top-1.5 right-2 w-3 h-3 bg-zinc-950 border-t border-l border-amber-500/40 transform rotate-45" />
        </div>
      )}
    </div>
  );
}

/**
 * Ultra-Luxurious Glassmorphic Card
 * Enhanced with frosted glass backdrop blur, delicate ambient border sheen,
 * and high-contrast typography.
 */
export function Card({ children, className = '', isMissing = false, missingTooltip = "This data not mentioned in the dataset" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-zinc-950/65 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_12px_44px_rgba(0,0,0,0.7)] group ${className}`}>
      {/* Frosted Top Light Sheen Reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      
      {/* Subtle Inner Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

      {isMissing && (
        <div className="absolute top-4 right-4 z-20">
          <MissingDataBadge tooltip={missingTooltip} />
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Frosted Glassmorphic Stat / Metric Card
 */
export function StatCard({ label, value, trend, icon, isMissing = false, missingTooltip = "This data not mentioned in the dataset" }) {
  return (
    <Card className="p-6 relative group" isMissing={isMissing} missingTooltip={missingTooltip}>
      <div className="flex justify-between items-start mb-4 pr-6">
        <div className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{label}</div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/10 via-violet-500/10 to-pink-500/10 border border-white/10 text-cyan-400 group-hover:scale-110 group-hover:text-white transition-all duration-300 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      <div className="text-3xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm">
        {isMissing ? '—' : value}
      </div>

      {isMissing ? (
        <div className="text-xs font-medium text-amber-400/90 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Field not in dataset</span>
        </div>
      ) : trend ? (
        <div className={`text-xs font-semibold flex items-center gap-1.5 ${
          trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-zinc-400'
        }`}>
          <span className={`px-1.5 py-0.5 rounded-md text-[11px] ${
            trend > 0 ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-rose-500/15 border border-rose-500/30'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
          </span>
          <span className="text-zinc-500 font-normal">vs last cycle</span>
        </div>
      ) : null}
    </Card>
  );
}
