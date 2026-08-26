/**
 * LoadingSpinner — Loading State Component
 * ============================================
 * Full-area or inline loading spinner.
 */

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  return (
    <div className="spinner-overlay">
      <div style={{ textAlign: 'center' }}>
        <div className={`spinner ${size === 'sm' ? 'spinner--sm' : ''}`} />
        {text && (
          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
