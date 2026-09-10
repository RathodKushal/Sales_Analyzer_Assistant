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
        <div className="absolute right-0 top-8 z-50 min-w-[240px] max-w-xs px-3 py-2 bg-zinc-950 text-zinc-100 text-xs rounded-lg border border-amber-500/40 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
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

export function Card({ children, className = '', isMissing = false, missingTooltip = "This data not mentioned in the dataset" }) {
  return (
    <div className={`bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden backdrop-blur-sm relative ${className}`}>
      {isMissing && (
        <div className="absolute top-4 right-4 z-20">
          <MissingDataBadge tooltip={missingTooltip} />
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, trend, icon, isMissing = false, missingTooltip = "This data not mentioned in the dataset" }) {
  return (
    <Card className="p-6 relative group" isMissing={isMissing} missingTooltip={missingTooltip}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4 pr-6">
        <div className="text-sm font-medium text-zinc-500 tracking-wide uppercase">{label}</div>
        {icon && <div className="text-zinc-600">{icon}</div>}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-zinc-100 mb-2">
        {isMissing ? '—' : value}
      </div>
      {isMissing ? (
        <div className="text-xs font-medium text-amber-400/80 flex items-center gap-1">
          <span>Not in dataset</span>
        </div>
      ) : trend ? (
        <div className={`text-sm font-medium flex items-center gap-1 ${
          trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-zinc-500'
        }`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
        </div>
      ) : null}
    </Card>
  );
}
