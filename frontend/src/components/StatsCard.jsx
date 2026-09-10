/**
 * StatsCard — KPI Metric Card
 * ================================
 * Displays a single KPI metric with icon, label, value, and optional change indicator.
 */

export default function StatsCard({ icon, label, value, change, variant = 'blue' }) {
  return (
    <div className={`stat-card stat-card--${variant} slide-up`}>
      <div className={`stat-card__icon stat-card__icon--${variant}`}>
        {icon}
      </div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {change && (
        <div className={`stat-card__change stat-card__change--${change.direction}`}>
          {change.direction === 'up' ? '↑' : '↓'} {change.text}
        </div>
      )}
    </div>
  );
}
