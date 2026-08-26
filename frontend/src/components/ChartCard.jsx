/**
 * ChartCard — Chart Widget Wrapper
 * ====================================
 * Wraps a Chart.js canvas inside a styled card.
 */

export default function ChartCard({ title, icon, children }) {
  return (
    <div className="chart-card slide-up">
      <div className="chart-card__title">
        {icon && <span>{icon}</span>}
        {title}
      </div>
      <div className="chart-card__body">
        {children}
      </div>
    </div>
  );
}
