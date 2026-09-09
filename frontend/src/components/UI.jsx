import { motion } from 'framer-motion';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, trend, icon }) {
  return (
    <Card className="p-6 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-medium text-zinc-500 tracking-wide uppercase">{label}</div>
        {icon && <div className="text-zinc-600">{icon}</div>}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-zinc-100 mb-2">{value}</div>
      {trend && (
        <div className={`text-sm font-medium flex items-center gap-1 ${
          trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-zinc-500'
        }`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
        </div>
      )}
    </Card>
  );
}
